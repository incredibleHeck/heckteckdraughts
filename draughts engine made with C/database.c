//free_

/*
 * Copyright 1996-2004 by Michel D. Grimminck
 *
 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 * 
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 * 
 * You should have received a copy of the GNU Lesser General Public
 * License along with this library; if not, write to the Free Software
 * Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA
 */

/*
   Endgame database generation program, based upon the Wu-Beal algorithm.
   This program can produce both 'Win/Draw/Lose' and 'Distance to Win' databases.
   
        
   The WU-BEAL algorithm
   =====================
   
   The algoritm was taken from:
   
   'A Memory Efficient Retrograde Algorithm and Its Application To Chinese Chess Endgames'
                             REN WU AND DONALD F. BEAL
   More Games of No Chance - MSRI Publications - Volume 42, 2002
   http://www.msri.org/publications/books/Book42/files/wu.pdf
   
   <start of quote>
   DATABASE W, B; // full databases (i.e. depth to win/loss for each position),
    // W for White-to-move positions, B for Black-to-move,
    // sequential access only
    SBITS S; // sequential access only bitmap
    RBITS R; // random access bitmap
    void TopLevel
        {
        DoInitialize();
        n = 0; // depth to mate or conversion
        while (!DoneWhite() && !DoneBlack())
            {
            if (!DoneWhite()) // last pass added new positions
            {
                S = Load(W, WIN_IN_N(n)); // S = WTM win_in_n
                R = Predecessor(S); // R = BTM predecessors of S
                S = Load(B, UNKNOWN); // S = BTM unknown
                S = S & R; // S = BTM maylose_in_n
                R = Load(W, WIN_<=_N(n)); // R = WTM win_in_n or less
                S = ProveSuccessor(S, R); // S = BTM lose_in_n
                B = Add(S, LOSE_IN_N(n)); // B += S
                if (dtm) // distance_to_mate?
                S = Load(B, LOSE_IN_N(n)); // S = BTM lose_in_n
                R = Predecessor(S); // R = WTM maybe win_in_n+1
                S = Load(W, UNKNOWN); // S = WTM unknown
                S = S & R; // S = WTM win_in_n+1
                W = Add(S, WIN_IN_N(n+1)); // W += S
                }
            if (!DoneBlack()) // done for BTM?
            {
                S = Load(B, WIN_IN_N(n)); // S = BTM win_in_n
                R = Predecessor(S); // R = WTM predecessors of S
                S = Load(W, UNKNOWN); // S = WTM unknown
                S = S & R; // S = WTM maylose_in_n
                R = Load(B, WIN_<=_N(n)); // R = BTM win_in_n or less
                S = ProveSuccessor(S, R); // S = WTM lose_in_n
                W = Add(S, LOSE_IN_N(n)); // W += S
                if (dtm) // distance_to_mate?
                S = Load(W, LOSE_IN_N(n)); // S = WTM lose_in_n
                R = Predecessor(S); // R = BTM maybe win_in_n+1
                S = Load(B, UNKNOWN); // S = BTM unknown
                S = S & R; // S = BTM win_in_n+1
                B = Add(S, WIN_IN_N(n+1)); // B += S
            }
            n = n + 1;
        }
    }
    <end of quote>
    
    It is all a bit more complicated than the basic algorithm, because the program
    needs to split up the databases in smaller fragments because of memory constraints;
    This causes a whole lot of complications.
    
    For the same reason, dragon also sometimes does some forward searches intermixed with
    the wu-beal algorithm.
    
    DATABASE STRUCTURE
    ==================
    
    A databases consist of a set of positions with a given number of white men,black men,
    white kings, black kings and the rank of the most leading white and black men.     
    
    This division is similar to chinook's databases.
    
    Program generates database with the following values:
    0  lose in 0
    1  win in 1 move
    2  lose in 2 moves
    3  win in 3
    ..
    etc
    253 temporary
    254 definite draw
    255 unknown
    
    ACCESSING THE DATABASE
    ======================
    To access the databases you need relavant functions and variables from
    the following files:
    
        index.c         The indexing function
        database.c      Various functions
        mem64.c         Memory management 
        const.h         Types and constants
        var.c,var.h     Some variables
        
    Example for retreiving a raw value from the database.
    init_databases();
    
    wm=bm=wc=bc=0;
    BOARD[F1]=black|man; bm++;
    BOARD[F2]=black|man; bm++;
    BOARD[F14]=white|crown; wc++;
    BOARD[F49]=white|man; wm++;
    BOARD[F50]=white|man; wm++;
    ws=findWS(wm,bm,bm,bc);
    bs=findBS(wm,bm,bm,bc);
    value=database_retreive_value(white,wm,bm,bm,bc,ws,bs)
    

    PERFORMANCE INFO
    ================
    (previous versions, for historically reasons only)
    XXvXX log: pentium 100: adapted scheaffer algorithm, WDL
    db:0202, found=139512, time=80
    db:0202, found=10415, time=245
    db:0202, found=115, time=238
    db:0202, found=0, time=240

    XXvXX log: amd 1667: adapted scheaffer algorithm, WDL
    db:0202, found=139512, time=3
    db:0202, found=10415, time=9
    db:0202, found=115, time=1
    db:0202, found=0, time=0
    2v2 tot OOvOO: 160 sec

    Generation time for 3v2 + 4v1=4.8 hour

    (this version)
    XXvXX, amd 2000 MHz, wu-beal, WDL   13.5 sec
    XXXvXX wu-beal, WDL  423 sec
    XXXXvXX  wu-beal, WDL  8150 sec
*/



#include <stdio.h>
#include "const.h"
#include "var.h"
#include "functions.h"
#include <time.h>
#ifdef USE_ZLIB
#include "/usr/include/zlib.h"
#endif

#define DB_INDEX_FILE "endgame2.ini"
#define DB_UNKNOWN 3
#define DB_ALL 100
#define CAPTURE 100(clock()-startTime)/CLOCKS_PER_SEC
#define PROMOTE 101
#define DB_VERIFY 200
#define QMAX 700000000000LLU
#define QNAME "tmpgen/q%i"

#define WDL 0
#define DTW 1

#define MPLY 252   // maximal plydepth in database
/* uncomment to create databases by forward searches only. This is very slow
   and for testing only.
   
   #define FORWARDONLY
*/



extern DBINDEX initDatabase(int,int,int,int,int,int,int,int,int,int,int);

FILE *logfile;
// number of positions in a database, index=database_nr()

int pos_count[4096*81];    
// size of database in bytes
DBINDEX bytesize[4096*81];   

// flag set if database passed verification
int verified[4096*81];       

/* The queues contains all positions that have a certain database value

   There are 4 different queue types
   0-255      positions with player 0 to move
   256-512    positions which have at least one successor of value n-256. Player 0 to move.
   512-767    positions with player 1 to move
   768-1023   positions which have at least one successor of value n-768. Player 1 to move
   
   notice: qsize must be signed
 */
INT64 qsize[1024],qmax[2];

/* file pointer to queues */
FILE *qfile[1024];  

// total amount of allocated memory in the memory handler
DBINDEX allocatedMemory;   

// maximal depth to win in any database, DTW metric
int maxDepth=0;   

// minimal number of iterations to complete current database
int minIteration=0; 

/* database metric mode
   WDL=Win/Draw/Lose, 2 bits per position
   DTW=Depth to win based, 8 bits per position
 */
int mode=WDL;

/* 'database' points to all databases with a maximum of 8 man and 8 crowns
   or contains NULL if the database is not present.

   All databases are computed for 'white to move'. If black is to move
   the board is reversed.
*/

#define DEFMAX 200000
int defMem64[DEFMAX];
DBINDEX defPOS[DEFMAX];
unsigned char defValue[DEFMAX];
int defCnt=0;


int countSliceWhite(int wman,int wcrown,int bman,int bcrown)
// returns the maximal number of white slices in a database-group
{
    if (wman+wcrown+bman+bcrown<=5) return(1);
	if (wman>0) return(9);
    
    return(1);
}

int countSliceBlack(int wman,int wcrown,int bman,int bcrown)
// returns the maximal number of black slices in a database-group
{
    if (wman+wcrown+bman+bcrown<=5) return(1);
    if (bman>0) return(9);
    return(1);
}

void checkMax(int d)
// records the maximal depth to win/lose up to now. (Just for informational purposes)
{
    if (d>maxDepth) {
        maxDepth=d;
    }
}

int databaseIsLoaded(int wman,int wcrown,int bman,int bcrown,int ws,int bs)
/* returns true is database is available in memory */
{
    int nr;
    
    nr=database_nr(0,wman,wcrown,bman,bcrown,ws,bs);
    if (mem64db[nr]>=0) return true;
    return false;
}

void init_queue_write(int q)
// opens a new positions queue for writing
{
    char qname[100];
    
    sprintf(qname,QNAME,q);
    qsize[q]=0;
    qfile[q]=fopen(qname,"wb");
    if (qfile[q]==NULL) {printf("fatal: can not open queue for writing\n"); abort();}
}

void init_queue_add(int q)
// opens an existing positions queue for additions
{
    char qname[100];
    
    sprintf(qname,QNAME,q);
    if (qsize[q]<0) qsize[q]=0;
    qfile[q]=fopen(qname,"ab");
    if (qfile[q]==NULL) {printf("fatal: can not open queue for writing (%s)\n",qname); abort();}
}


void init_queue_read(int q)
// opens a position queue for reading
{
    char qname[100];
    sprintf(qname,QNAME,q);
    if (qsize[q]<0) {printf("fatal: attempting to open incomplete queue: %i\n",q); exit(1);}
    qfile[q]=fopen(qname,"rb");
    if (qfile[q]==NULL) {printf("fatal: can not open queue for reading\n"); exit(1);}
}

void removeQueues()
// clean up the queues after we are done
{
    int i;
    char qname[100];
 
    for (i=0;i<1024;i++) {
        sprintf(qname,QNAME,i);
        unlink( qname);
        qsize[i]=-1LL;
    }
}
    
void add_to_queue(int q)
// write the current board position to the specified queue
{
    int i,n;


    if (qfile[q]==NULL) return; /* queue not open (anymore) */
#ifdef notdef
    if (qsize[q]>=QMAX) {
        printf("warning: maximal queue size reached: closing queue\n");
        fclose(qfile[q]);
        qfile[q]=NULL;
        qsize[q]=-1; /* queue incomplete: don't use it */
        return;
    }
#endif
    n=0; for(i=0;i<50;i++) if (board[map[i]]!=empty) n++;
    fputc(n,qfile[q]);
    for(i=0;i<50;i++) if (board[map[i]]!=empty) {
            fputc(i,qfile[q]);
            fputc(board[map[i]],qfile[q]);
        }
    qsize[q]++;
}

static char* read_from_queue(int q)
// read a position from the specified queue
{
    int i,n,p;
    static char local[93];

    if (qfile[q]==NULL) {printf("fatal: attempting to read from closed queue\n"); exit(1);}
    if (feof(qfile[q])) {
        fclose(qfile[q]);
        qfile[q]=NULL;
        return(false);
    }

    for(i=0;i<50;i++) local[map[i]]=empty;
    n=fgetc(qfile[q]);
    for(i=0;i<n;i++) {
        p=fgetc(qfile[q]);
        local[map[p]]=fgetc(qfile[q]);
    }
    return(local);
}

void close_queue(int q)
// close the queue
{
    if (qfile[q]!=NULL) fclose(qfile[q]);
    qfile[q]=NULL;
}


char *database_short_name(int wman,int wcrown,int bman,int bcrown)
{
// returns the core filename of a database (without directory or extension), without
// slices and wdl.
// example filename: XXOvOOOO

    static char name[40];
    int a=0,i;

    for(i=0;i<wcrown;i++) name[a++]='X';
    for(i=0;i<wman;i++) name[a++]='O';
    name[a++]='v';
    for(i=0;i<bcrown;i++) name[a++]='X';
    for(i=0;i<bman;i++) name[a++]='O';
    name[a]='\0';
    return(name);
}


char *database_nameExt(int wman,int wcrown,int bman,int bcrown,int ws,int bs,int metric)
// returns the core filename of a database (without directory or extension)
// example filename: wld7-XXOvOOOO-45
{
    static char name[40];
    int a=0,i;

	if (metric==WDL) {
		name[a++]='w';
		name[a++]='d';
		name[a++]='l';
		name[a++]=48+wcrown+wman+bcrown+bman;
		name[a++]='-';
	} else {
		name[a++]='d';
		name[a++]='t';
		name[a++]='w';
		name[a++]=48+wcrown+wman+bcrown+bman;
		name[a++]='-';
	} 
	
    for(i=0;i<wcrown;i++) name[a++]='X';
    for(i=0;i<wman;i++) name[a++]='O';
    name[a++]='v';
    for(i=0;i<bcrown;i++) name[a++]='X';
    for(i=0;i<bman;i++) name[a++]='O';
    name[a++]='-';
    name[a++]=48+ws;
    name[a++]=48+bs;
    name[a]='\0';
    return(name);
}

char *database_name(int wman,int wcrown,int bman,int bcrown,int ws,int bs)
{
    return(database_nameExt(wman,wcrown,bman,bcrown,ws,bs,mode));
}

void decompressDTWdatabase(int wman,int wcrown,int bman,int bcrown,int ws,int bs)
{
    char source_filename[100],target_filename[100],*id;
    FILE *in;

    id=database_nameExt(wman,wcrown,bman,bcrown,ws,bs,DTW);
    sprintf(source_filename,"databases/%s.raw.gz",id);
    sprintf(target_filename,"dtw/%s.raw",id);
    
    if (windows==true) {
        winprint("\n");
        winprint("PROGRESS|*|*|*|*|decompressing %s\n",source_filename);
    }

    decompressGZfile(source_filename,target_filename);

}

char *verify_name(int wman,int wcrown,int bman,int bcrown,int ws,int bs)
// returns the full filename of a verified indication, including extension
// example filename: verify-wld7-XXOvOOOO-45.txt
{
    static char name[40];
    sprintf(name,"verify/%s.txt",database_name(wman,wcrown,bman,bcrown,ws,bs));
    return(name);
}
    
void database_piecelist(int *piecelist,int wman,int wcrown,int bman,int bcrown)
{
    int a=0,i;

    for(i=0;i<wcrown;i++) piecelist[a++]=white|crown;
    for(i=0;i<wman;i++) piecelist[a++]=white|man;
    for(i=0;i<bcrown;i++) piecelist[a++]=black|crown;
    for(i=0;i<bman;i++) piecelist[a++]=black|man;
}

void database_count(char *id,int *wman,int *wcrown,int *bman,int *bcrown)
/* returns the number of pieces for a database
   id=pointer to core filename (see database_name())
 */
{
    int n;

    *wman=*bman=*wcrown=*bcrown=0;

    printf("s:%s\n",id);
    n=0;
    while(id[n]!='v') {
        if (id[n]=='X') *wcrown++;
        if (id[n]=='O') *wman++;
        n++;
    }
    while(id[n]!=0) {
        if (id[n]=='X') *bcrown++;
        if (id[n]=='O') *bman++;
        n++;
    }
    printf("s:%i %i\n",n,*wman);
}

int load_database(int wman,int wcrown,int bman,int bcrown,int ws,int bs)
// loads a database into memory
// returns true if succesfull
{
    char db_file[100],*id;
    DBINDEX i;
    int nr;
    DBINDEX size;
    FILE *db;
    int use_compression=false;
    char *p;

    id=database_name(wman,wcrown,bman,bcrown,ws,bs);
#ifdef USE_ZLIB
    sprintf(db_file,"databases/%s.raw.gz",id);
#else
    sprintf(db_file,"databases/%s.raw",id);
#endif
    size=db_count(wman,wcrown,bman,bcrown,ws,bs);
    nr=database_nr(white,wman,wcrown,bman,bcrown,ws,bs);
    if (mem64db[nr] !=-1) return (true);  //already loaded

    pos_count[nr]=size;
    bytesize[nr]=(size+3);
    if (mode==WDL) {
        bytesize[nr]=(size+3)/4;
    }

    if (!availableOnDisk(wman,wcrown,bman,bcrown,ws,bs)) {
        printf("database %s not found\n",db_file);
        mem64db[nr]=-1;
        return(false);
    }
        
    mem64db[nr]=mem64_allocate(bytesize[nr]);
    if (mem64db[nr]<0) {
        printf("fatal: no memory for database (%i Mb)\n",bytesize[nr]/1024/1024);
        exit(1);
    }
    allocatedMemory+=sizeof(unsigned char)*bytesize[nr];

    strcat(id,"             ");
    id[16]=0;  // fix length: 123v5678-90.
    
    printf("loading %s         \r",id);
    fflush(stdout);
    /* make sure that the memory is mapped in ram to prevent excessive swapping */
    
    for(i=0;i<bytesize[nr];i+=256) {
        p=mem64_pointer(mem64db[nr],i,true);
        *p=0;
    }
    
    if (use_compression==false) {
        mem64_load(mem64db[nr],db_file);
    }

    if (windows==true) {
        winprint("\n");
        winprint("PROGRESS|*|*|*|*|loading %s\n",id);
    }

    dprint("loading %s      (Size = %4u Mb, total memory = %4u Mb)      \n",id,(int) (bytesize[nr]/1024/1024),(int) (allocatedMemory/1024/1024));
    printf("                                     \r");
    fflush(stdout);
    return(true);
}

void load_databaseFull(int wman,int wcrown,int bman,int bcrown)
// loads all slices of the given database
{
    int ws,bs;
    int maxws,maxbs;
    
    maxws=countSliceWhite(wman,wcrown,bman,bcrown);
    maxbs=countSliceBlack(wman,wcrown,bman,bcrown);
    for (ws=0;ws<maxws;ws++) {
        for (bs=0;bs<maxbs;bs++) {
            load_database(wman,wcrown,bman,bcrown,ws,bs);
        }
    }
}

int total_db_size(void)
{
    int i;
    int sum=0;

    for(i=0;i<4096*81;i++) {
        if (mem64db[i]>=0) sum+=sizeof(unsigned char)*bytesize[i];
    }
    return(sum);
}

void init_databases(void)
{
    int i;
    for(i=0;i<4096*81;i++) {
        mem64db[i]=-1;
        verified[i]=false;
        loadDatabaseOnDemand[i]=false;
        dtwStatus[i]=0;
    }
    init_index();
}

void read_all_databases(int maxpieces)
{
    /* reads in all available databases defined in the file 'DB_INDEX_FILE'
    */
    FILE *in;
    char id[12],include;
    int wman,wcrown,bman,bcrown,i,ndb,ii,byte_size,type,n,nr;
    int manc[20]={0,1,  0,1,2,  0,1,2,3,  0,1,2,3,4,   0,1,2,3,4,5};
    int cc[20]=  {1,0,  2,1,0,  3,2,1,0,  4,3,2,1,0,   5,4,3,2,1,0};
    int j;
    int cnt;
    int ws,bs,wsmax,bsmax;
    char db[10];
    char state[10];
    int wm,wk,bm,bk;
    
    in=my_fopen(DB_INDEX_FILE,"r");
    if (in==NULL) {
        printf("error: database index file not found\n");
        return;
    }
    for (i=0;i<4096*81;i++) {
        loadDatabaseOnDemand[i]=false;
    }
    
    /* read all selected databases */
    /*
    for(ii=0;ii<21;ii++) {
        for (j=0;j<21;j++) {
            fscanf(in,"%s",id);
            if (id[0]!='.' && ii>0 && j>0) {
                cnt=manc[ii-1]+cc[ii-1]+manc[j-1]+cc[j-1];
                if (cnt<=maxpieces) {
                    wsmax=countSliceWhite(manc[ii-1],cc[ii-1],manc[j-1],cc[j-1]);
                    bsmax=countSliceBlack(manc[ii-1],cc[ii-1],manc[j-1],cc[j-1]);
                    for (ws=0;ws<wsmax;ws++) {
                        for (bs=0;bs<bsmax;bs++) {
                            nr=database_nr(white,manc[ii-1],cc[ii-1],manc[j-1],cc[j-1],ws,bs);
                            if (mem64db[nr]<0) {
                                load_database(manc[ii-1],cc[ii-1],manc[j-1],cc[j-1],ws,bs);
                            }
                        }
                    }
                }
            }
        }
    }
    */
    while (!feof(in)) {
        fscanf(in,"%s %s\n",db,state);
        wm=db[0]-'0';
        wk=db[1]-'0';
        bm=db[2]-'0';
        bk=db[3]-'0';
     
        if (strcmp(state,"PRE")==0) {
            load_databaseFull(wm,wk,bm,bk);
        }
        if (strcmp(state,"DEM")==0) {
            for (ws=0;ws<countSliceWhite(wm,wk,bm,bk);ws++) {
                for (bs=0;bs<countSliceBlack(wm,wk,bm,bk);bs++) {
                    
                    nr=database_nr(white,wm,wk,bm,bk,ws,bs);
                    //printf("%i %i %i %i %i\n",wm,wk,bm,bk,nr);
                    loadDatabaseOnDemand[nr]=true;
                }
            }
        }
    }
    fclose(in);
    winprint("\n");
    //winprint("PROGRESS|*|*|*|*|\n",id);
}

int database_nr(int color,int wman,int wcrown,int bman,int bcrown,int ws,int bs)
/* returns the number of the requested database */
{
    int nr;

    if (color==white) nr=81*(wman+8*wcrown+64*bman+512*bcrown)+9*ws+bs;
    else nr=81*(bman+8*bcrown+64*wman+512*wcrown)+9*bs+ws;
    return(nr);
}

int findWS(int wman,int wcrown,int bman,int bcrown)
/* returns the white slice number of the current position
*/
{
	int wm=white|man;
	
	if (wman==0) return(0);
	if (wman+wcrown+bman+bcrown<=5) return(0);
	
	if (board[F6]==wm || board[F7]==wm || board[F8]==wm || board[F9]==wm || board[F10]==wm) return(8);
	if (board[F11]==wm || board[F12]==wm || board[F13]==wm || board[F14]==wm || board[F15]==wm) return(7);
	if (board[F16]==wm || board[F17]==wm || board[F18]==wm || board[F19]==wm || board[F20]==wm) return(6);
	if (board[F21]==wm || board[F22]==wm || board[F23]==wm || board[F24]==wm || board[F25]==wm) return(5);
	if (board[F26]==wm || board[F27]==wm || board[F28]==wm || board[F29]==wm || board[F30]==wm) return(4);
	if (board[F31]==wm || board[F32]==wm || board[F33]==wm || board[F34]==wm || board[F35]==wm) return(3);
	if (board[F36]==wm || board[F37]==wm || board[F38]==wm || board[F39]==wm || board[F40]==wm) return(2);
	if (board[F41]==wm || board[F42]==wm || board[F43]==wm || board[F44]==wm || board[F45]==wm) return(1);
	if (board[F46]==wm || board[F47]==wm || board[F48]==wm || board[F49]==wm || board[F50]==wm) return(0);
}

int findBS(int wman,int wcrown,int bman,int bcrown)
/* returns the black slice number of the current position
*/
{
	int bm=black|man;
	
	if (bman==0) return(0);
	
	if (wman+wcrown+bman+bcrown<=5) return(0);
	if (board[F41]==bm || board[F42]==bm || board[F43]==bm || board[F44]==bm || board[F45]==bm) return(8);
	if (board[F36]==bm || board[F37]==bm || board[F38]==bm || board[F39]==bm || board[F40]==bm) return(7);
	if (board[F31]==bm || board[F32]==bm || board[F33]==bm || board[F34]==bm || board[F35]==bm) return(6);
	if (board[F26]==bm || board[F27]==bm || board[F28]==bm || board[F29]==bm || board[F30]==bm) return(5);
	if (board[F21]==bm || board[F22]==bm || board[F23]==bm || board[F24]==bm || board[F25]==bm) return(4);
	if (board[F16]==bm || board[F17]==bm || board[F18]==bm || board[F19]==bm || board[F20]==bm) return(3);
	if (board[F11]==bm || board[F12]==bm || board[F13]==bm || board[F14]==bm || board[F15]==bm) return(2);
	if (board[F6]==bm || board[F7]==bm || board[F8]==bm || board[F9]==bm || board[F10]==bm) return(1);
	if (board[F1]==bm || board[F2]==bm || board[F3]==bm || board[F4]==bm || board[F5]==bm) return(0);
}

int database_retreive_value(int color,int wman,int wcrown,int bman,int bcrown,int ws,int bs)
/* retreives the value of a database entry for the current board position. The the piece count
   and slice numbers need to be specified for performance reasons.
   
   See also: read_value()
   
   Returns a value from the perspective of 'color'.
   */
{
    DBINDEX index,dindex;
    int score;
    unsigned char *db;
    static int counter=0;
    int w;
    int handle;
    
    /* no pieces: return LOSE */
    if (color==white) if (wman==0 && wcrown==0) return(0);
    if (color==black) if (bman==0 && bcrown==0) return(0);
    handle=mem64db[database_nr(color,wman,wcrown,bman,bcrown,ws,bs)];
    //printf("nr:%i",database_nr(color,wman,wcrown,bman,bcrown,ws,bs));
    index=database_linear_index(color);
    if (index<0) {
        printf("fatal: exception 1, %llu\n",dindex);
        exit(1);
    }
  	if (mode==WDL) {
        dindex=index/4;
	    db=mem64_pointer(handle,dindex,false);
        switch(index-4*dindex) {
            case 0:{score=(*db >>6)&3;break;}
            case 1:{score=(*db >>4)&3;break;}
            case 2:{score=(*db >>2)&3;break;}
            case 3:{score=*db &3;break;}
        }
        if (score==2) score=254;
        if (score==3) score=255;
        return(score);
	} else {
	    db=mem64_pointer(handle,index,false);  //read-only access
	    return(*db);
	}
}

int database_valueDTW(int color,int wman,int wcrown,int bman,int bcrown)
/* retreives the value of a DTW database entry from disk. The the piece count
   and slice numbers need to be specified for performance reasons.
      
   Returns a value from the perspective of 'color':

    0  lose in 0
    1  win in 1 ply
    2  lose in 2 ply
    3  win in 3
    ..
    etc
    254 definite draw
    UNKNOWN unknown

   */
{
    DBINDEX index,dindex;
    int score;
    unsigned char *db;
    static int counter=0;
    int w;
    int handle;
    char db_filename[100],*id;
    int wm,wc,bm,bc,ws,bs;
    int nr;
    int ws1,bs1;
    
    if (use_db==false) return(UNKNOWN);

    ws1=findWS(wman,wcrown,bman,bcrown);
    bs1=findBS(wman,wcrown,bman,bcrown);

    FILE *in;
    int result;
    
    if (color==white) {
        wm=wman;
        wc=wcrown;
        bm=bman;
        bc=bcrown;
        ws=ws1;
        bs=bs1;
    } else {
        bm=wman;
        bc=wcrown;
        wm=bman;
        wc=bcrown;
        bs=ws1;
        ws=bs1;
    }
    /* no pieces: return LOSE */
    if (wm==0 && wc==0) return(0);
    nr=database_nr(white,wm,wc,bm,bc,ws,bs);
    if (dtwStatus[nr]==1) {
        return(UNKNOWN);
    }
    if (dtwStatus[nr]==0) {   
        //status unknown: check if available uncompressed
        id=database_nameExt(wm,wc,bm,bc,ws,bs,DTW);
        sprintf(db_filename,"dtw/%s.raw",id);
        in=fopen(db_filename,"rb");
        if (in==NULL) {
            // not available uncompressed, try compressed
            if (availableOnDiskExt(wm,wc,bm,bc,ws,bs,DTW)) {
                decompressDTWdatabase(wm,wc,bm,bc,ws,bs);
                dtwStatus[nr]=2;
            }
            else {
                dtwStatus[nr]=1;
                return(UNKNOWN);
            }
        } else {
            // available
            fclose(in);
            dtwStatus[nr]=2;
        }
    }
    // At this point we know the database is available uncompressed on disk   
    index=database_linear_index(color);
    if (index<0) {
        printf("fatal: exception 1, %llu\n",dindex);
        exit(1);
    }

    id=database_nameExt(wm,wc,bm,bc,ws,bs,DTW);
    sprintf(db_filename,"dtw/%s.raw",id);
    result=UNKNOWN;
    in=fopen(db_filename,"rb");
    if (in==NULL) { printf("Unexpected error\n"); exit(1); }
    fseek(in,index,SEEK_SET);
    result=fgetc(in);
    fclose(in);    
    if (result<0) {
        dprint("MSGBOX|Decompression error: %s\n",id);
    }
    return(result);
}

int read_value(int handle,DBINDEX index)
// Very fast read from the database for a know database handle and position index.
{
    DBINDEX dindex;
    int score;
    dindex=index;
    unsigned char *p;
    
    if (index<0) {
        printf("fatal: exception 2, %llu\n",dindex);
        display_board();
        exit(1);
    }

	if (mode==WDL) {
        dindex=index/4;
	    p=mem64_pointer(handle,dindex,false);
        switch(index-4*dindex) {
            case 0:{score=(*p >>6)&3;break;}
            case 1:{score=(*p >>4)&3;break;}
            case 2:{score=(*p >>2)&3;break;}
            case 3:{score=*p &3;break;}
        }
        if (score==2) score=254;
        if (score==3) score=255;
        return(score);

	} else {
		p=mem64_pointer(handle,index,false);
	    return(*p);
	}
}

void store_value(int handle,DBINDEX index,int score)
// Very fast write-to database for a know database handle and position index.
{
    DBINDEX dindex;
    unsigned char *p;
    
    if (index<0) {
        printf("fatal: exception 3, %llu\n",dindex);
        exit(1);
    }

    if (mode==WDL) {
    	dindex=index/4;
    	p=mem64_pointer(handle,dindex,true);

		/* map depth-based score to 2 bits */
    	if (score<MPLY) {
    		score = score & 1;
    	} else if (score==253) {
    		return;
    	} else if (score==254) {
    		score=2;
    	} else if (score==255) {
    		score=3;
    	}

		/* store */
        switch(index-4*dindex) {
            case 0:{
                *p=((*p)&63)+(score*64);
                break;
            }
            case 1:{
                *p=((*p)&207)+(score*16);
                 break;
            }
            case 2:{
                *p=((*p)&243)+(score*4);
                break;
            }
            case 3:{
                *p=((*p)&252)+(score);
                 break;
            }
        }
    } else {
    	p=mem64_pointer(handle,index,true);
	    *p=score;
	}
}

void init_deferred_write(void)
{
    defCnt=0;
}

void close_deferred_write(void)
{
    int i;
    
    if (defCnt==0) return;
    printf("%i\n",defCnt);
    for (i=0;i<defCnt;i++) {
        store_value(defMem64[i],defPOS[i],defValue[i]);
    }
    defCnt=0;
}

void store_value_deferred(int mem64handle,DBINDEX index,int value)
{
    defMem64[defCnt]=mem64handle;
    defPOS[defCnt]=index;
    defValue[defCnt]=value;
    defCnt++;
    if (defCnt==DEFMAX) close_deferred_write();
}


void free_all(int skip1,int skip2)
// releases all databases from memory, except for database nr skip1 and skip2.
{
    int nr;
    char *id;
    int wman,wcrown,bman,bcrown;
    int freeThis;
    int nrb;
    int ws,bs;
    
    return;
    for (nr=0;nr<4096*81;nr++) {
        freeThis=false;
        if (mem64db[nr]>=0 && nr!=skip1 && nr!=skip2) freeThis=true;
        
        if (freeThis==true) {
            allocatedMemory-=sizeof(unsigned char)*bytesize[nr];
            nrb=nr/81;
            wman=nrb & 7;
            wcrown=(nrb/8) & 7;
            bman=(nrb/64) &7;
            bcrown=(nrb/512) & 7;
            ws=(nr-81*nrb)/9;
            ws=(nr-81*nrb) % 9;
            id=database_name(wman,wcrown,bman,bcrown,ws,bs);
            strcat(id,"             ");
            id[16]=0;
            printf("freeing %s      (Size = %4i Mb, total memory = %4u Mb)  \n",id,-(int)bytesize[nr]/1024/1024,allocatedMemory/1024/1024);
            mem64_free(mem64db[nr]);
            mem64db[nr]=-1;
        }
    }
}

void makeSureLoaded(int wman,int wcrown,int bman,int bcrown,int ws,int bs)
/* makes sure that the given database is loaded into memory,
   set ws=-1 to load all slices
 */
{
   int nr;
   if (ws>=0) {
       nr=database_nr(white,wman,wcrown,bman,bcrown,ws,bs);
       if (mem64db[nr]<0) {
           load_database(wman,wcrown,bman,bcrown,ws,bs);
       }
   } else {
       for (ws=0;ws<countSliceWhite(wman,wcrown,bman,bcrown);ws++) {
           for (bs=0;bs<countSliceBlack(wman,wcrown,bman,bcrown);bs++) {
               nr=database_nr(white,wman,wcrown,bman,bcrown,ws,bs);
               if (mem64db[nr]<0) {
                   load_database(wman,wcrown,bman,bcrown,ws,bs);
               }
            }
        }
    }                
}

void countvalue(int wman,int wcrown,int bman,int bcrown,int ws,int bs)
/* Counts and the prints the depth-distribution of all positions of the database. Database must be in memory */
/* use ws=-1,bs=-1 to count all slices */
{
    int nr;
    DBINDEX dtw[256];
    
    DBINDEX size;
    DBINDEX index;
    int piecelist[20];
    DBINDEX win=0,draw=0,lose=0,unknown=0;
    int v;
    
    for (v=0;v<256;v++) dtw[v]=0;
    
    if (ws>=0) {
	    nr=database_nr(white,wman,wcrown,bman,bcrown,ws,bs);
	    size=pos_count[nr];
	    
	    for(index=0;index<size;index++) {
	        v=read_value(mem64db[nr],index);
	        if (v>MPLY) draw++;
	        else if ((v & 1)==1) win++;
	        else if ((v & 1)==0) lose++;
	        dtw[v]++;
	    }
	} else {
		for (ws=0;ws<countSliceWhite(wman,wcrown,bman,bcrown);ws++) {
			for (bs=0;bs<countSliceBlack(wman,wcrown,bman,bcrown);bs++) {
			    nr=database_nr(white,wman,wcrown,bman,bcrown,ws,bs);
			    
			    size=pos_count[nr];
			    
			    for(index=0;index<size;index++) {
			        v=read_value(mem64db[nr],index);
			        if (v>MPLY) draw++;
			        else if ((v & 1)==1) win++;
			        else if ((v & 1)==0) lose++;
			        dtw[v]++;
			    }
			}
		}
	}
    for (v=0;v<MPLY;v++) if (dtw[v]!=0) {
        printf("dtw %i: %s\n",v,neatNumber(dtw[v]));
        fprintf(logfile,"dtw %i: %s\n",v,neatNumber(dtw[v]));
    }
    
    fprintf(logfile,"win %9s  ",neatNumber(win));
    fprintf(logfile,"draw %9s  ",neatNumber(draw));
    fprintf(logfile,"lose %9s  ",neatNumber(lose));

    printf("win %9s  ",neatNumber(win));
    printf("draw %9s  ",neatNumber(draw));
    printf("lose %9s  ",neatNumber(lose));
    printf("unknown/illegal %s\n",neatNumber(unknown));


}


int nextboard2(int *list,int *type,int *constraint,int *min,int *max,int p)
// true=stop now
// false=continue
// 2=failure: try again


{
    int try,stop=false;

    if (p<0) return(true);
    board[map[list[p]]]=empty;
    if ((type[p] & 1)==white) {
        do {
            list[p]++;
        } while(board[map[list[p]]]!=empty && list[p]<max[p]);
        if (list[p]>=max[p]) {
    back:
            stop=nextboard2(list,type,constraint,min,max,p-1);
            try=min[p];
            if (constraint[p]==1) try=list[p-1]+1;
            while(board[map[try]]!=empty && try<max[p]) try++;
            if (try>=max[p]) {
                if (stop==true && constraint[p]==0) return(2);
                goto back;
            }
            list[p]=try;
        }
    } else {
        do {
            list[p]--;
        } while(board[map[list[p]]]!=empty && list[p]>=min[p]);
        if (list[p]<min[p]) {
    backblack:
            stop=nextboard2(list,type,constraint,min,max,p-1);
            try=max[p]-1;
            if (constraint[p]==1) try=list[p-1]-1;
            while(board[map[try]]!=empty && try>=min[p]) try--;
            if (try<min[p]) {
                //if (stop==true) return(2);
                goto backblack;
            }
            list[p]=try;
        }
    }
    
    board[map[list[p]]]=type[p];
    return(stop);
}

int nextboard(int *list,int *type,int *constraint,int *min,int *max,int p)
{
    int v;
    int i;
    
    //for (i=0;i<=p;i++) {
    //    printf("%i %i %i min=%i max=%i\n",list[i],type[i],constraint[i],min[i],max[i]);
    //}
    v=nextboard2(list,type,constraint,min,max,p);
    if (v==2) return(true);
    return(v);
}

int init_nextboard(int *list,int *type,int *constraint,int *min,int *max,int wman,int wcrown,int bman,int bcrown,int ws,int bs)

{
    int i,j,n;
    int j0;
    int st;
    
    init_board();
    for(i=0;i<50;i++) board[map[i]]=empty;
    //for(i=0;i<12;i++) list[i]=49;
    for(i=0;i<12;i++) constraint[i]=1;
    j=0;
    constraint[j]=0;
    if (bman>0) {
        j0=j;
        if (wman+wcrown+bman+bcrown<=5) {
            min[j]=0;
            max[j]=45;
        } else {    
            min[j]=5*bs; max[j]=5*bs+5; 
        }
        list[j]=0;
        type[j++]=black|man;
    }
    for(i=1;i<bman;i++) {
        min[j]=0; max[j]=max[j0]; 
        list[j]=0;
        type[j++]=black|man;
        }
    constraint[j]=0;
    if (wman>0) {
        j0=j;
        if (wman+wcrown+bman+bcrown<=5) {
            min[j]=5;
            max[j]=50;
        } else {
            min[j]=45-5*ws;
            max[j]=50-5*ws;
        }
        list[j]=50;
        type[j++]=white|man;
    }
    for(i=1;i<wman;i++) {
        min[j]=min[j0]; max[j]=50; list[j]=50;
        type[j++]=white|man;
    }
    constraint[j]=0;
    for(i=0;i<bcrown;i++) {min[j]=0; max[j]=50; list[j]=0; type[j++]=black|crown;}
    constraint[j]=0;
    for(i=0;i<wcrown;i++) {min[j]=0; max[j]=50; list[j]=50; type[j++]=white|crown;}
    n=j;
    st=nextboard2(list,type,constraint,min,max,n-1);
    if (st==2) { // first position failed, try again
        printf("\n\n5 man init_failure prevented\n\n");
        st=nextboard(list,type,constraint,min,max,n-1);
    }
    return(n);
}


DBINDEX tryPos(int nr,DBINDEX index,int player,int iteration,int bs,int ws,int markDone,int singleColorMode)
{
    int m,cur,bestwin,count,bestlose,lose,ws1,bs1,m0,score;
    int nmoves,nmoves0;
    DBINDEX found=0;
    
    nmoves0=move_list(0,white);
    count=nmoves0;
    bestwin=256;
    bestlose=-1;
    lose=0;
    
    bs1=findBS(pieces[white|man],pieces[white|crown],pieces[black|man],pieces[black|crown]);
    for(m0=0;m0<nmoves0;m0++) {
        do_move(movelist[0][m0]);
        //set_pieces();

        ws1=findWS(pieces[white|man],pieces[white|crown],pieces[black|man],pieces[black|crown]);
        score=database_retreive_value(black,pieces[white|man],pieces[white|crown],pieces[black|man],pieces[black|crown],ws1,bs1);
        
        if (score<MPLY) {
            if (score>minIteration) {
                minIteration=score;
            }
            if ((score & 1)==1  && score<iteration) { // opponent loses -> i win
                if (score>bestlose) bestlose=score;
                lose++;
            } 
        }
        undo_move(movelist[0][m0]);
        if (lose !=(m0+1)) {
            break;
        }
    }
    if (lose==nmoves0) {  //i lose
        if (singleColorMode==false) store_value(mem64db[nr],index,bestlose+1);
        //if (singleColorMode==true) store_value_deferred(mem64db[nr],index,bestlose+1);
        checkMax(bestlose+1);
        add_to_queue(512*player+iteration);  //mark
        found++;
    } else {
        if (markDone==true) {
            if (singleColorMode==false) store_value(mem64db[nr],index,253);
          //  if (singleColorMode==true) store_value_deferred(mem64db[nr],index,253);
        }
    }
    return(found);
}
DBINDEX iterateFromQueue(int nr,int nr2,int wman,int wcrown,int bman,int bcrown,int ws,int bs,int iteration,int mirror,int player)
{
    int nmoves,m,result;
    DBINDEX index,found=0,size;
    DBINDEX i,j,n;
    int list[12],type[12],constraint[12],min[12],max[12];
    int piecelist[40]; /* type of piece for 1 ... n */
    
    int starttime;
    static char *local;
    int cur,count,bestwin,bestlose,score;
    int lose;    
    int nmoves0,m0;
    int k=0;
    int W;
    int nplayer;
    int q;
    int qIn;
    int markDone=true;
    int ws1,bs1;
    DBINDEX bytesize;

    int singleColorMode=false;
    int goForward=false;
    
    if (wcrown>1) singleColorMode=true;
    singleColorMode=false;
    nplayer=1-player;
    if (mirror==1) nplayer=player;
    
    starttime=clock();
    size=db_count(wman,wcrown,bman,bcrown,ws,bs);
    init_queue_add(512*player+iteration);
    init_queue_read(512*nplayer+iteration-1);
    init_board();
    
    qIn=512*nplayer+iteration-1;
    if (qsize[qIn]<0.003*size) markDone=false; /* don't mark positions that are already done for small
                                    queues, because we need to go through entire database if we do. */
    
    bytesize=size;
    if (mode==WDL) bytesize=size/4;
    
    if (bytesize>0.45*mem64_RAM() && qsize[qIn]>0.0005*size) goForward=true;  
    if (qsize[qIn]>0.05*size) goForward=true;
    
    if (goForward==true) {
        /* slow forward search, but good if you are low on memory */
        i=0;
        n=init_nextboard(list,type,constraint,min,max,wman,wcrown,bman,bcrown,ws,bs);
        database_piecelist(piecelist,wman,wcrown,bman,bcrown);
        do {
            set_pieces();
            index=database_linear_index(white);
            if (read_value(mem64db[nr],index)==255) {
                found+=tryPos(nr,index,player,iteration,ws,bs,markDone,singleColorMode);
            }
            i++;
            if ((i&2047)==0) {
                printf("forward %i/1: %0.4f  n=%s (da: %llu Mb)   \r",iteration+player,((double)i)/((double)size),neatNumber(size),mem64_diskActivity/1024/1024);
                fflush(stdout);            
                }
        } while(nextboard(list,type,constraint,min,max,n-1)==false);
    } else {
        /* fast backward search for if memory is plenty */
        //init_deferred_write();
        for(i=0;i<qsize[qIn];i++) {
            if ((i&2047)==0) {
                printf("backtracking %i/1:  %0.4f  n=%s (da: %llu Mb)         \r",iteration+player,(float)i/qsize[512*nplayer+iteration-1],neatNumber(qsize[qIn]),mem64_diskActivity/1024/1024);
                fflush(stdout);
                }
            local=read_from_queue(512*nplayer+iteration-1);
            /* we now have a new board position, with black to move. Undo the
               last (white) move and do a forward search. If results, store into
               the out-queue
               */
            reverse_board(board,local);
            
            set_pieces();
            nmoves=reverse_move_list(1,white);
        
            for(m=0;m<nmoves;m++) {
                do_move(movelist[1][m]); /* we have a potential position, try it ! */
                index=database_linear_index(white);
                if (findWS(pieces[white|man],pieces[white|crown],pieces[black|man],pieces[black|crown]) == ws && 
                    findBS(pieces[white|man],pieces[white|crown],pieces[black|man],pieces[black|crown]) == bs) {
                    cur=read_value(mem64db[nr],index);
                } else {
                    cur=254;
                }
            
                if (cur==255) {
                    found+=tryPos(nr,index,player,iteration,ws,bs,markDone,singleColorMode);
                }
                undo_move(movelist[1][m]);
            }
        }
    }
    
    close_queue(512*nplayer+iteration-1);
    close_queue(512*player+iteration);
    //if (singleColorMode==true) close_deferred_write();
    
    // replace 253 value by 255
    if (markDone==true) {
        size=db_count(wman,wcrown,bman,bcrown,ws,bs);
        for(index=0;index<size;index++) {
            if (read_value(mem64db[nr],index)==253) {
                store_value(mem64db[nr],index,255);
            }
        }
    }
        
    // --- pass 2 ---------------------------------------------------------------


    q=512*player+256+iteration-1;  // lose in n, player 0

    init_board();
    
    if (qsize[q]>0) {
        init_queue_read(q);
        init_queue_add(512*player+iteration);
                
            
        for(i=0;i<qsize[q];i++) {
            if ((i&1023)==0) {
                printf("backtracking %i/2:  %0.4f  n=%s (da: %llu Mb)         \r",iteration+player,(float)i/(qsize[q]+1),neatNumber(qsize[q]),mem64_diskActivity/1024/1024);
                fflush(stdout);
                }
            local=read_from_queue(q);

            for(j=0;j<50;j++) board[map[j]]=local[map[j]];
            //display_board(); printf("2\n");
            index=database_linear_index(white);
            cur=read_value(mem64db[nr],index);
            if (cur>MPLY && cur!=254) {
                set_pieces();

                nmoves0=move_list(0,white);
                count=nmoves0;
                bestwin=256;
                bestlose=-1;
                lose=0;
                for(m0=0;m0<nmoves0;m0++) {
                    do_move(movelist[0][m0]);
                    ws1=findWS(pieces[white|man],pieces[white|crown],pieces[black|man],pieces[black|crown]);
                    bs1=findBS(pieces[white|man],pieces[white|crown],pieces[black|man],pieces[black|crown]);
                    score=database_retreive_value(black,pieces[white|man],pieces[white|crown],pieces[black|man],pieces[black|crown],ws1,bs1);
                    if (score<MPLY) {
                        if ((score & 1)==0  && score<iteration) { // opponent loses -> i win
                            if (score<bestwin) bestwin=score;
                        } else if (score<iteration) {  // opponent wins -> i lose
                            if (score>bestlose) bestlose=score;
                            lose++;
                        }
                        if (score>minIteration) {
                            minIteration=score;
                        }
                     }
                    undo_move(movelist[0][m0]);
                }
                if (lose==nmoves0) {  //i lose
                    store_value(mem64db[nr],index,bestlose+1);
                    checkMax(bestlose+1);
                    add_to_queue(512*player+iteration);
                    found++;
                }
            }
        }
        close_queue(512*player+iteration);
        close_queue(q);
    }
    // --- pass 3 ---------------------------------------------------------------
    init_queue_read(512*player+iteration);
    init_queue_add(512*nplayer+iteration+1);
    init_board();
    qIn=512*player+iteration;
    
    for(i=0;i<qsize[qIn];i++) {
        
        if ((i&2047)==0) {
            printf("backtracking %i/3:  %0.4f  n=%s (da: %llu Mb)         \r",iteration+player,(float)i/qsize[qIn],neatNumber(qsize[qIn]),mem64_diskActivity/1024/1024);
            fflush(stdout);
            }
        local=read_from_queue(512*player+iteration);
        reverse_board(board,local);
        set_pieces();
        index=database_linear_index(white);
        ws1=findWS(pieces[white|man],pieces[white|crown],pieces[black|man],pieces[black|crown]);  //???
        bs1=findBS(pieces[white|man],pieces[white|crown],pieces[black|man],pieces[black|crown]);  //???

        cur=database_retreive_value(black,pieces[white|man],pieces[white|crown],pieces[black|man],pieces[black|crown],ws1,bs1);
        nmoves=reverse_move_list(1,white);
        for(m=0;m<nmoves;m++) {
            do_move(movelist[1][m]);
            index=database_linear_index(white);

            if (findBS(pieces[white|man],pieces[white|crown],pieces[black|man],pieces[black|crown]) == ws && 
                findWS(pieces[white|man],pieces[white|crown],pieces[black|man],pieces[black|crown]) == bs) {
                cur=read_value(mem64db[nr2],index);
            } else {
                cur=254;
            }
            if (cur>MPLY && cur!=254) {
                store_value(mem64db[nr2],index,iteration+1);
                checkMax(iteration+1);
                add_to_queue(512*nplayer+iteration+1);
            }
            undo_move(movelist[1][m]);
        }
    }
    
    close_queue(512*nplayer+iteration+1);
    close_queue(512*player+iteration);
    // --- pass 4 ---------------------------------------------------------------

    q=512*nplayer+256+iteration;  // lose in n, player 0
    
    if (qsize[q]>=0) {
        init_queue_read(q);
        init_queue_add(512*nplayer+iteration+1);
        
        
        for(i=0;i<qsize[q];i++) {
            if ((i&1023)==0) {
                printf("backtracking %i/4:  %0.4f  n=%s (da: %llu Mb)         \r",iteration+player,(float)i/(qsize[q]+1),neatNumber(qsize[q]),mem64_diskActivity/1024/1024);
                fflush(stdout);
                }
            local=read_from_queue(q);
            for(j=0;j<50;j++) board[map[j]]=local[map[j]];
            //display_board(); printf("4\n");
            index=database_linear_index(white);
            cur=read_value(mem64db[nr2],index);
            if (cur>MPLY && cur!=254) {
                store_value(mem64db[nr2],index,iteration+1);
                checkMax(iteration+1);
                add_to_queue(512*nplayer+iteration+1);
            }
        }
        close_queue(512*nplayer+iteration+1);
        close_queue(q);
    }

    printf("backward %i: found=%s, time=%i                      \n",iteration+player,neatNumber(found),(clock()-starttime)/CLOCKS_PER_SEC); fflush(stdout);
    fprintf(logfile,"db:%i%i%i%i, found=%s, time=%.1f\n",wman,wcrown,bman,bcrown,neatNumber(found),(float) (clock()-starttime)/CLOCKS_PER_SEC); fflush(logfile);
    return(found);
}


DBINDEX findCaptures(int nr,int wman,int wcrown,int bman,int bcrown,int ws,int bs,int outq,int mirror,int player)
{
    DBINDEX index,i,j,n,size,found=0;
    int score,trypos;
    DBINDEX ni=0;
    DBINDEX total;
    int piecelist[40]; /* type of piece for 1 ... n */
    int list[12],type[12],constraint[12],min[12],max[12];
    int stop=false,starttime,result;
    FILE *out=NULL;
    int bestwin;
    int bestlose;
    int nmoves;
    int m; //,count;
    int lose;
    int cur;
    int wsm,bsm;
    int cnt=0;
    starttime=clock();
    total=db_count(wman,wcrown,bman,bcrown,ws,bs);
    n=init_nextboard(list,type,constraint,min,max,wman,wcrown,bman,bcrown,ws,bs);
    //printf("n=%i\n\n",n);
    size=pos_count[nr];
    database_piecelist(piecelist,wman,wcrown,bman,bcrown);
    do {
        //for (m=0;m<6;m++) {
        //    printf("%i %i %i  %i  %i\n",list[m],min[m],max[m],constraint[m],type[m]);
       // }
        //printf("\n");
        set_pieces();
        index=database_linear_index(white);
        
        if (!quiet(white)) {  //xxx
            cur=read_value(mem64db[nr],index);
            if (cur>MPLY) {
                nmoves=move_list(0,white);
                if (nmoves==0) {
                    store_value(mem64db[nr],index,0);  //lose
                    add_to_queue(512*player+1);
                    found++;
                } else {
                    bestwin=256;
                    bestlose=-1;
                    lose=0;
                    for(m=0;m<nmoves;m++) {
                        do_move(movelist[0][m]);
                        wsm=findWS(pieces[white|man],pieces[white|crown],pieces[black|man],pieces[black|crown]);
                        bsm=findBS(pieces[white|man],pieces[white|crown],pieces[black|man],pieces[black|crown]);
                        score=database_retreive_value(black,pieces[white|man],pieces[white|crown],pieces[black|man],pieces[black|crown],wsm,bsm);
                        if (score<MPLY) {
                            if ((score & 1)==0) { // opponent loses -> i win
                                if (score<bestwin) bestwin=score;
                            } else {  // opponent wins -> i lose
                                if (score>bestlose) bestlose=score;
                                lose++;
                            }
                            if (score>minIteration) {
                                minIteration=score;
                            }
                        }
                        undo_move(movelist[0][m]);
                    }
                    if (bestwin<256) {  // can force a win
                        store_value(mem64db[nr],index,bestwin+1);
                        if (qfile[512*player+bestwin+1]==NULL) {
                            init_queue_add(512*player+bestwin+1);
                        }
                        add_to_queue(512*player+bestwin+1);

                        checkMax(bestwin+1);
                        found++;
                    } else if (lose==nmoves) {  //i lose
                        store_value(mem64db[nr],index,bestlose+1);
                        if (qfile[512*player+bestlose+1]==NULL) {
                            init_queue_add(512*player+bestlose+1);
                        }
                        add_to_queue(512*player+bestlose+1);
                        checkMax(bestlose+1);
                        found++;
                    } else {
                        store_value(mem64db[nr],index,254);  // definite draw
                    }
                }
            }
        } else {
            cur=read_value(mem64db[nr],index);
            if (cur>MPLY) {
                nmoves=move_list(0,white);
                if (nmoves==0) {
                    store_value(mem64db[nr],index,0);  //lose
                    add_to_queue(512*player+1);
                    found++;
                }
            }
        }    
        ni++;
        if ((ni&2047)==0) {
            printf("capture: %0.4f  (da: %llu Mb)   \r",(float)ni/total,mem64_diskActivity/1024/1024);
            fflush(stdout);            
            }

    } while(nextboard(list,type,constraint,min,max,n-1)==false);

    for (i=0;i<1024;i++) {
        close_queue(i);
    }

    printf("capture: found=%s, time=%i              \n",neatNumber(found),(clock()-starttime)/CLOCKS_PER_SEC);
    fflush(stdout);
    fprintf(logfile,"capture:%i%i%i%i, found=%s, time=%i\n",wman,wcrown,bman,bcrown,neatNumber(found),(int)(clock()-starttime)/CLOCKS_PER_SEC); fflush(logfile);
    return(found);
}
   
DBINDEX initDatabase(int nr,int wman,int wcrown,int bman,int bcrown,int ws,int bs,int outq,int mirror,int iteration,int player)
/* does one iteration in creating database 'nr'. Returns the number of
   newly discovered positions */
{
    DBINDEX index,i,j,n,size,found=0;
    int score,trypos;
    DBINDEX ni=0;
    DBINDEX total;
    int piecelist[40]; /* type of piece for 1 ... n */
    int list[12],type[12],constraint[12],min[12],max[12];
    int stop=false,starttime,result;
    FILE *out=NULL;
    int bestwin;
    int bestlose;
    int nmoves;
    int m,count;
    int v;
    int un;
    int lose;
    int findWin=0;
    int findLose=0;
    int searchMore=0;
    int cur;
    int add;
    int offset;  //offset for conversion queue
    int wsm,bsm;    
    
    starttime=clock();
    total=db_count(wman,wcrown,bman,bcrown,ws,bs);
    n=init_nextboard(list,type,constraint,min,max,wman,wcrown,bman,bcrown,ws,bs);
    size=pos_count[nr];
    database_piecelist(piecelist,wman,wcrown,bman,bcrown);
    
    init_queue_add(512*player+iteration);
    
    if ((iteration & 1)==1) {
        findWin=1;
        findLose=0;
    } else {
        findWin=0;
        findLose=1;
    }
    do {
        set_pieces();
        index=database_linear_index(white);
        cur=read_value(mem64db[nr],index);
        if (cur>MPLY && cur!=254) {
            nmoves=move_list(0,white);
            if (nmoves==0) {
                store_value(mem64db[nr],index,0);  //lose
                if (qfile[0]==NULL) {
                    init_queue_add(0);
                }
                add_to_queue(0);
                found++;
            } else {
                count=nmoves;
                bestwin=256;
                bestlose=-1;
                lose=0;
                bsm=findBS(pieces[white|man],pieces[white|crown],pieces[black|man],pieces[black|crown]);
                for(m=0;m<nmoves;m++) {
                    add=false;
                    do_move(movelist[0][m]);
                    wsm=findWS(pieces[white|man],pieces[white|crown],pieces[black|man],pieces[black|crown]);
                    score=database_retreive_value(black,pieces[white|man],pieces[white|crown],pieces[black|man],pieces[black|crown],wsm,bsm);
                    if (score<MPLY) {
                        if ((score & 1)==0  && score<iteration) { // opponent loses -> i win
                            if (score<bestwin) bestwin=score;
                        } else if (score<iteration) {  // opponent wins -> i lose
                            if (score>bestlose) bestlose=score;
                            lose++;
                        }
                        if (score>minIteration) {
                            minIteration=score;
                        }
                        // if position is in different database, put them in the queue
                        // for later iterations
                        if (wman != pieces[white|man] || bman != pieces[black|man] || wcrown != pieces[white|crown] || bcrown != pieces[black|crown] || ws != wsm || bs != bsm) {
                            add=true;
                        }
                    }
                    undo_move(movelist[0][m]);

 
                    if (add==true) {
                        if (qfile[score+512*player+256]==NULL) {
                            init_queue_add(score+512*player+256);
                        }
                        add_to_queue(score+512*player+256);
                        //if (score==2) { display_board(); printf("id: \n"); }
                    }
                } //end for m
                if (bestwin<256) {  // can force a win
                    store_value(mem64db[nr],index,bestwin+1);
                    checkMax(bestwin+1);
                    add_to_queue(512*player+bestwin+1);
                    found++;
                } else if (lose==nmoves) {  //i lose
                    store_value(mem64db[nr],index,bestlose+1);
                    checkMax(bestlose+1);
                    add_to_queue(512*player+bestlose+1);
                    found++;
                } else {
                   // store_value(mem64db[nr],index,255);
                }
                
                /*if (mode==PROMOTE) {printf("%i\n",ni); display_board();fflush(stdout);}*/
            }
        }
        ni++;
        if ((ni&2047)==0) {
            printf("forward: %0.4f  (da: %llu Mb)   \r",(float)ni/total,mem64_diskActivity/1024/1024);
            fflush(stdout);            
            }
    } while(nextboard(list,type,constraint,min,max,n-1)==false);

    printf("forward: found=%s, time=%i              \n",neatNumber(found),(clock()-starttime)/CLOCKS_PER_SEC);
    fflush(stdout);
    fprintf(logfile,"db:%i%i%i%i-%i%i, found=%s, time=%i\n",wman,wcrown,bman,bcrown,ws,bs,neatNumber(found),(int)(clock()-starttime)/CLOCKS_PER_SEC); fflush(logfile);
    for (i=0;i<1024;i++) {
        close_queue(i);
    }
    if (found==0 && searchMore==1) found=1;
    //abort();
    return(found);
}

void validqueue(int *q1,int *q2)
{
    /* if all went ok, q2 contains a valid queue: use this as
       input queue
       */
    //*q1=1-*q1; *q2=1-*q2;
}

int availableOnDiskFull(int wman,int wcrown,int bman,int bcrown)
/* returns true if the given database is fully available on disk, for all its slices */
{
    int ws,bs;
    
    ws=countSliceWhite(wman,wcrown,bman,bcrown)-1;
    bs=countSliceBlack(wman,wcrown,bman,bcrown)-1;
    return availableOnDisk(wman,wcrown,bman,bcrown,0,0);
}

int availableOnDisk(int wman,int wcrown,int bman,int bcrown,int ws,int bs)
{
    return(availableOnDiskExt(wman,wcrown,bman,bcrown,ws,bs,mode));
}

int availableOnDiskExt(int wman,int wcrown,int bman,int bcrown,int ws,int bs,int metric)
/* returns true if database is available on disk */
{
    char db_filename[100],*id;
    FILE *in;

    id=database_nameExt(wman,wcrown,bman,bcrown,ws,bs,metric);
    #ifdef USE_ZLIB
        sprintf(db_filename,"databases/%s.raw.gz",id);
    #else
        sprintf(db_filename,"databases/%s.raw",id);
    #endif
    in=fopen(db_filename,"rb");
    if (in==NULL) return (false);
    fclose(in);
    return (true);
}



void create_database(int wman,int wcrown,int bman,int bcrown,int ws,int bs,int level)
/*
    Provides the general structure of the solving program; it makes sure
    that the order of database generation is correct and takes care of the
    memory management and loading/storing databases.
    
    Use ws=-1,bs=-1 for all slices
*/
{
    int wm,wc,bm,bc;
    unsigned char *db;
    char db_file[2][100],*id;
    int nr[2];
    DBINDEX size[2];
    DBINDEX p,n,i;
    DBINDEX pos,found=0,newfound,loaded=0;
    int q1,q2;
    float startingTime;
    int onDisk;
    int iteration=0;
    int dNr=0;
    
    FILE *out,*in;
    int mirror;  /* mirror is set to 1 for symmetric databases, 2 otherwise */

    if (level<0) return;
        
    if (ws<0) ws=0;
    if (bs<0) bs=0;
    
    /* has it been created ? */
    nr[0]=database_nr(white,wman,wcrown,bman,bcrown,ws,bs);
    nr[1]=database_nr(white,bman,bcrown,wman,wcrown,bs,ws);

    /* filenames */
    id=database_name(wman,wcrown,bman,bcrown,ws,bs);
    #ifdef USE_ZLIB
        sprintf(db_file[0],"databases/%s.raw.gz",id);
    #else
        sprintf(db_file[0],"databases/%s.raw",id);
    #endif
    id=database_name(bman,bcrown,wman,wcrown,bs,ws);
    #ifdef USE_ZLIB
        sprintf(db_file[1],"databases/%s.raw.gz",id);
    #else
        sprintf(db_file[1],"databases/%s.raw",id);
    #endif

    /* determen size of the database(s) */
    size[0]=db_count(wman,wcrown,bman,bcrown,ws,bs);
    size[1]=db_count(bman,bcrown,wman,wcrown,bs,ws);

    /* symmetric database ? */
    if (nr[0]==nr[1]) mirror=1; else mirror=2;

    /* check if database is already loaded */
    if (mem64db[nr[0]]>=0 && mem64db[nr[1]]>0) { /* database is already present */
        return;
    }
    /* if possible: load database from disk */
    if (availableOnDisk(wman,wcrown,bman,bcrown,ws,bs) && availableOnDisk(bman,bcrown,wman,wcrown,bs,ws)) {
        load_database(wman,wcrown,bman,bcrown,ws,bs);
        return;
    }

    /* current database is not loaded, nor on disk, so we will be creating the
       database now.
       
       First we have to make sure that we created all required sub-databases.
       Dont load any from disk, we will do that on demand later.
    */

    /* database 0: capture 1 or more black pieces */
    for(bm=0;bm<=bman;bm++)
        for (bc=0;bc<=bcrown;bc++)
            if ((bc > 0 || bm > 0) && !(bm == bman && bc == bcrown)) {
                if (!availableOnDiskFull(bm,bc,wman,wcrown)) create_database(bm,bc,wman,wcrown,-1,-1,level-1);
                if (wman>0 && !availableOnDiskFull(bm,bc,wman-1,wcrown+1)) create_database(bm,bc,wman-1,wcrown+1,-1,-1,level-1);  /* capture AND promote */
            }
    
    /* database 0: promote a white man */
    if (wman>0 && ws == (countSliceWhite(wman,wcrown,bman,bcrown)-1) && !availableOnDiskFull(bman,bcrown,wman-1,wcrown+1)) create_database(bman,bcrown,wman-1,wcrown+1,-1,-1,level-1);
    
    /* database 1: capture 1 or more white pieces */
    for(wm=0;wm<=wman;wm++)
        for (wc=0;wc<=wcrown;wc++)
            if ((wc > 0 || wm > 0) && !(wm == wman && wc == wcrown)) {
                if (!availableOnDiskFull(wm,wc,bman,bcrown)) create_database(wm,wc,bman,bcrown,-1,-1,level-1);
                if (bman>0 && !availableOnDiskFull(wm,wc,bman-1,bcrown+1)) create_database(wm,wc,bman-1,bcrown+1,-1,-1,level-1);
            }
    /* promote a black man */
    if (bman>0 && bs == (countSliceWhite(wman,wcrown,bman,bcrown)-1) && !availableOnDiskFull(wman,wcrown,bman-1,bcrown+1)) create_database(wman,wcrown,bman-1,bcrown+1,-1,-1,level-1);
    /* forward a white man */
    if (wman>0 && ws < (countSliceWhite(wman,wcrown,bman,bcrown)-1) && !availableOnDisk(wman,wcrown,bman,bcrown,ws+1,bs)) create_database(wman,wcrown,bman,bcrown,ws+1,bs,level-1);
    /* forward a black man */
    if (bman>0 && bs < (countSliceBlack(wman,wcrown,bman,bcrown)-1) && !availableOnDisk(wman,wcrown,bman,bcrown,ws,bs+1)) create_database(wman,wcrown,bman,bcrown,ws,bs+1,level-1);
    /* free all memory */
    //free_all(-1,-1);
    
    /* initialise queue system */
    removeQueues();
    startingTime=clock();
    found=0;
    minIteration=0;
    
    if (mirror==1) {
        /* first pass: capture moves only */
        
        pos_count[nr[0]]=size[0];
        bytesize[nr[0]]=(size[0]+3);
        if (mode==WDL) {
        	bytesize[nr[0]]=(size[0]+3)/4;
        }
        mem64db[nr[0]]=mem64_allocate(bytesize[nr[0]]);
        allocatedMemory+=sizeof(unsigned char)*bytesize[nr[0]];

        set_col(33,33);
        printf("creating %s, %s positions (Total memory alloc: %u Mb)   \n",database_name(wman,wcrown,bman,bcrown,ws,bs),neatNumber(size[0]),allocatedMemory/1024/1024);
        res_col();

        if (mem64db[nr[0]]<0)  {
            printf("fatal: no memory for database (%i Mb)\n",bytesize[nr[0]]/1024/1024);
            exit(1);
        }
        
        /* set everything to draw */
        for(p=0;p<size[1];p++) {
            store_value(mem64db[nr[1]],p,255);
        }

        // load sub-databases (capture)
        for(bm=0;bm<=bman;bm++)
            for (bc=0;bc<=bcrown;bc++)
                if ((bc > 0 || bm > 0) && !(bm == bman && bc == bcrown)) {
                    load_databaseFull(bm,bc,wman,wcrown);
                    load_databaseFull(wman,wcrown,bm,bc);
                    if (wman>0) {
                        load_databaseFull(bm,bc,wman-1,wcrown+1);
                        load_databaseFull(wman-1,wcrown+1,bm,bc);
                    }
                }
        // load sub-databases (promotion)
        if (wman>0) {
            load_databaseFull(bman,bcrown,wman-1,wcrown+1);
            load_databaseFull(wman-1,wcrown+1,bman,bcrown);
        }
        // load sub-databases (moving a slice forward)
        if (wman>0 && ws<(countSliceWhite(wman,wcrown,bman,bcrown)-1)) {
            load_database(wman,wcrown,bman,bcrown,ws+1,bs);
        }
        // xxx remove later
        if (bman>0 && bs<(countSliceBlack(wman,wcrown,bman,bcrown)-1)) {
            load_database(wman,wcrown,bman,bcrown,ws,bs+1);
        }
        
        iteration=0;
        found+=findCaptures(nr[0],wman,wcrown,bman,bcrown,ws,bs,q1,mirror,0);
        found+=initDatabase(nr[0],wman,wcrown,bman,bcrown,ws,bs,q1,mirror,iteration+1,0);
        iteration+=2;

        /* second pass: force all positions being seen */

        while(found>0 || iteration<=(minIteration+2)) {
#ifdef FORWARDONLY
            found=initDatabase(nr[0],wman,wcrown,bman,bcrown,ws,bs,-1,mirror,iteration+1,0);
#else
            found=iterateFromQueue(nr[0],nr[0],wman,wcrown,bman,bcrown,ws,bs,iteration,mirror,0);
#endif
            iteration+=2;
        }
    }
    else {
        /* initialise white to move database */
        pos_count[nr[0]]=size[0];
        bytesize[nr[0]]=(size[0]+3);
		if (mode==WDL) {
        	bytesize[nr[0]]=(size[0]+3)/4;
        }

        mem64db[nr[0]]=mem64_allocate(bytesize[nr[0]]);
        allocatedMemory+=sizeof(unsigned char)*bytesize[nr[0]];
        set_col(33,33);
        printf("creating %s, %s positions (Total memory alloc: %u Mb)   \n",database_name(wman,wcrown,bman,bcrown,ws,bs),neatNumber(size[0]),allocatedMemory/1024/1024);
        res_col();
            if (mem64db[nr[0]]<0) {
                printf("fatal: no memory for database (%i Mb)\n",bytesize[nr[0]]/1024/1024);
                exit(1);
            }
        
        for(p=0;p<size[0];p++) {
            store_value(mem64db[nr[0]],p,255);
        }

        /* first pass: capture moves only: white to move*/
        for(bm=0;bm<=bman;bm++)
            for (bc=0;bc<=bcrown;bc++)
                if ((bc > 0 || bm > 0) && !(bm == bman && bc == bcrown)) {
                    //printf("%i %i %i %i\n",bm,bc,wman,wcrown);
                    load_databaseFull(bm,bc,wman,wcrown);
                    if (wman>0) load_databaseFull(bm,bc,wman-1,wcrown+1);
                }
        
        /* initialise black to move database */
        pos_count[nr[1]]=size[1];
        bytesize[nr[1]]=(size[1]+3);
        if (mode==WDL) {
        	bytesize[nr[1]]=(size[1]+3)/4;
        }

        mem64db[nr[1]]=mem64_allocate(bytesize[nr[1]]);
        allocatedMemory+=sizeof(unsigned char)*bytesize[nr[1]];
        set_col(33,33);
        printf("creating %s, %s positions (Total memory alloc: %i Mb)   \n",database_name(bman,bcrown,wman,wcrown,bs,ws),neatNumber(size[1]),allocatedMemory/1024/1024);
        res_col();
        if (mem64db[nr[1]]<0) {
            printf("fatal: no memory for database (%i Mb)\n",bytesize[nr[1]]/1024/1024);
            exit(1);
        }
        for(p=0;p<size[1];p++) {
            store_value(mem64db[nr[1]],p,255);
        }
        /* first pass: capture moves only: black to move */
        for(wm=0;wm<=wman;wm++)
            for (wc=0;wc<=wcrown;wc++)
                if ((wc > 0 || wm > 0) && !(wm == wman && wc == wcrown)) {
                    load_databaseFull(wm,wc,bman,bcrown);
                    if (bman>0) load_databaseFull(wm,wc,bman-1,bcrown+1);
                }
        
        /* load databases for moves with promotions but no captures */
        
        if (wman>0) {
            load_databaseFull(bman,bcrown,wman-1,wcrown+1);
        }
        if (bman>0) {
            load_databaseFull(wman,wcrown,bman-1,bcrown+1);
        }

        // load sub-databases (moving a slice forward)
        if (wman>0 && ws<(countSliceWhite(wman,wcrown,bman,bcrown)-1)) {
            load_database(bman,bcrown,wman,wcrown,bs,ws+1);
        }

        if (bman>0 && bs<(countSliceBlack(wman,wcrown,bman,bcrown)-1)) {
            load_database(wman,wcrown,bman,bcrown,ws,bs+1);  //?
        }
    
        /* second pass: force all positions being seen */
        
        iteration=0;
        found+=findCaptures(nr[0],wman,wcrown,bman,bcrown,ws,bs,q1,mirror,0);  // finds all captures
        found+=findCaptures(nr[1],bman,bcrown,wman,wcrown,bs,ws,q1,mirror,1);
            
        found+=initDatabase(nr[0],wman,wcrown,bman,bcrown,ws,bs,-1,mirror,iteration+1,0);  // finds all lose in 0 positions
        found+=initDatabase(nr[1],bman,bcrown,wman,wcrown,bs,ws,q1,mirror,iteration+1,1); // finds all lose in 0 positions and win in 1
                    
        iteration+=2;

        dNr=1;
        do {
            
#ifdef FORWARDONLY
            dNr=newfound;
            printf("sdfasf1\n");
        
            found+=newfound=initDatabase(nr[0],wman,wcrown,bman,bcrown,ws,bs,-1,mirror,iteration+1,0);
            if (newfound>0 && iteration>=minIteration) minIteration=iteration;

            if (newfound==0 && dNr!=0 && iteration>(minIteration+20)) break;
            dNr=newfound;
            found+=newfound=initDatabase(nr[1],bman,bcrown,wman,wcrown,bs,ws,q1,mirror,iteration+1,1);
#else
            dNr=newfound;
            found+=newfound=iterateFromQueue(nr[0],nr[1],wman,wcrown,bman,bcrown,ws,bs,iteration,mirror,0);
            if (newfound==0 && dNr!=0 && iteration>(minIteration+20)) break;
            dNr=newfound;
            found+=newfound=iterateFromQueue(nr[1],nr[0],bman,bcrown,wman,wcrown,bs,ws,iteration,mirror,1);
#endif
            if (newfound>0 && iteration>=minIteration) minIteration=iteration;
            iteration+=2;
        } while(newfound!=0 || dNr!=0 ||  iteration<=(minIteration+20));
    }

    for(i=0;i<mirror;i++) for(p=0;p<size[i];p++) {
        if (read_value(mem64db[nr[i]],p)==255) {
            store_value(mem64db[nr[i]],p,254);
        }
    }

    /* wrapping up */
    printf("Total time: time=%.1f\n",(clock()-startingTime)/CLOCKS_PER_SEC);
    fprintf(logfile,"Total time: =%.1f\n",(clock()-startingTime)/CLOCKS_PER_SEC);
    printf("a total of %s positions have been solved\n",neatNumber(found));
    printf("Accumulative disk activity:%llu Mb\n",mem64_diskActivity/1024/1024);
    //printf("Accumulative disk activity:%llu Mb\n",mem64_diskActivity);
    
    fflush(stdout);
    if (ws==0 && bs==0) {
        if (mirror==2) countvalue(bman,bcrown,wman,wcrown,-1,-1);
        countvalue(wman,wcrown,bman,bcrown,-1,-1);
    }

    /* write databases */
    for(i=0;i<mirror;i++) {
        printf("writing file '%s'\n",db_file[i]);
        mem64_save(mem64db[nr[i]],db_file[i]);
    }
    
    if (ws==0 && bs==0 && allocatedMemory>mem64_RAM()) {
        free_all(nr[0],nr[1]);
    }
        
}

DBINDEX debug(int value,int wman,int wcrown,int bman,int bcrown,int ws,int bs)
/* prints all position in a database with value 'value'.
   Use value=DB_VERIFY to verify a database. Returns number of positions or errors found.
 */
{
    DBINDEX nr,size,i,j,n;
    DBINDEX index,count;
    DBINDEX dtw[256];
    DBINDEX win=0,draw=0,lose=0,unknown=0;
    int v;
    int list[12],type[12],constraint[12],min[12],max[12];
    char *id;
    int best,known,original,score,nmoves,m;
    DBINDEX total;
    count=0;
    int bestlose;
    int k=0;
    int wsm,bsm;
    float startingTime;
    char ver_name[100];
    FILE *in;
    
    id=database_name(wman,wcrown,bman,bcrown,ws,bs);
    total=db_count(wman,wcrown,bman,bcrown,ws,bs);
    sprintf(ver_name,"%s",verify_name(wman,wcrown,bman,bcrown,ws,bs));

    for (v=0;v<256;v++) dtw[v]=0;
    
    set_col(33,33);
    if (value==DB_VERIFY) {
        in=fopen(ver_name,"r");
        if (in!=NULL) {
            fclose(in);
            printf("%s already verified, %s positions\n",id,neatNumber(total));
            res_col();
            return(0);
        }
        printf("verifying %s, %s positions\n",id,neatNumber(total));
    } else {
        printf("debug %s, searching value %i\n",id,value);
    }
        
    fprintf(logfile,"debug %s, searching value %i\n",id,value);
    res_col();
    nr=database_nr(white,bman,bcrown,wman,wcrown,bs,ws);
    if (mem64db[nr]<0)  {
        load_database(bman,bcrown,wman,wcrown,bs,ws);
    }
    
    nr=database_nr(white,wman,wcrown,bman,bcrown,ws,bs);
    if (mem64db[nr]<0)  {
        load_database(wman,wcrown,bman,bcrown,ws,bs);
    }
    startingTime=clock();
    n=init_nextboard(list,type,constraint,min,max,wman,wcrown,bman,bcrown,ws,bs);
    i=0;
    do {
        index=database_linear_index(white);
        if (value==DB_VERIFY && mode==DTW) {
            original=v=read_value(mem64db[nr],index);
            
	        if (v>MPLY) draw++;
	        else if ((v & 1)==1) win++;
	        else if ((v & 1)==0) lose++;
	        dtw[v]++;

            best=256; known=true;
            bestlose=-1;
            set_pieces();
            nmoves=move_list(0,white);
            for(m=0;m<nmoves;m++) {
                do_move(movelist[0][m]);
                wsm=findWS(pieces[white|man],pieces[white|crown],pieces[black|man],pieces[black|crown]);
                bsm=findBS(pieces[white|man],pieces[white|crown],pieces[black|man],pieces[black|crown]);
                score=database_retreive_value(black,pieces[white|man],pieces[white|crown],pieces[black|man],pieces[black|crown],wsm,bsm);
                if (score<MPLY) {
                    if ((score & 1)==0) {  // win
                        if (score<best) best=score;
                    } else { // lose
                        if (score>bestlose) bestlose=score;
                    }
                } else {
                    known=false;
                }
                undo_move(movelist[0][m]);
            }
            if (original>MPLY && known==true) {
                printf("%i %i %i\n",original,best,bestlose);
                printf("error found! (1) nr:%llu ply0 value:%i, best: value:%i, lose value: %i, index:%i\n",i,original,best,bestlose,index);
                display_board();
                i++;
            }
            if (original<MPLY && (original & 1)==0 && original!=(bestlose+1)) {
            printf("%i %i %i\n",original,best,bestlose);
            printf("error found! (2) nr:%llu ply0 value:%i, best: value:%i, lose value: %i, index:%i\n",i,original,best,bestlose,index);
                display_board();
                i++;
            }

            if (original<MPLY && (original & 1)==1 && original!=(best+1)) {
            printf("%i %i %i\n",original,best,bestlose);
            printf("error found! (3) nr:%llu ply0 value:%i, best: value:%i, lose value: %i, index:%i\n",i,original,best,bestlose,index);
                display_board();
                printf("\n");
                i++;
                for(m=0;m<nmoves;m++) {
                    do_move(movelist[0][m]);
                    wsm=findWS(pieces[white|man],pieces[white|crown],pieces[black|man],pieces[black|crown]);
                    bsm=findBS(pieces[white|man],pieces[white|crown],pieces[black|man],pieces[black|crown]);
                    score=database_retreive_value(black,pieces[white|man],pieces[white|crown],pieces[black|man],pieces[black|crown],wsm,bsm);
                    undo_move(movelist[0][m]);
                }
            }
        }
        else if (value==DB_VERIFY && mode==WDL) {
            original=v=read_value(mem64db[nr],index);
            if (original==255) original=254;
            
   	        if (v>MPLY) draw++;
	        else if ((v & 1)==1) win++;
	        else if ((v & 1)==0) lose++;
	        dtw[v]++;

            best=0; known=true;
            set_pieces();
            nmoves=move_list(0,white);
            for(m=0;m<nmoves;m++) {
                do_move(movelist[0][m]);
                wsm=findWS(pieces[white|man],pieces[white|crown],pieces[black|man],pieces[black|crown]);
                bsm=findBS(pieces[white|man],pieces[white|crown],pieces[black|man],pieces[black|crown]);
                score=database_retreive_value(black,pieces[white|man],pieces[white|crown],pieces[black|man],pieces[black|crown],wsm,bsm);
                undo_move(movelist[0][m]);
                if (score==0) {best=1; break;}
                if (score==254 || score==255) best=254;
            }
            if (known==false || best!=original) {
                printf("error found! nr:%llu ply0 value:%i ply1 value:%i, index:%i\n",i,original,best,index);
                display_board();
                i++;
            }
        } else if (value==DB_ALL || read_value(mem64db[nr],index)==value) {
            display_board();
            printf("index: %i nr:%i  value:%i\n",index,i,read_value(mem64db[nr],index));
            i++;
        }
        
        if ((count&1023)==0) {
            printf("%0.4f (da: %llu Mb)           \r",(float)count/total,mem64_diskActivity/1024/1024);
            fflush(stdout);
            }
        count++;
    } while(nextboard(list,type,constraint,min,max,n-1)==false);
    
    if (value==DB_VERIFY) {
        FILE *out;
        
        printf("verified %s, time=%.1f,  errors: %llu, pos: %llu\n\n",id,(clock()-startingTime)/CLOCKS_PER_SEC,i,count);
        fprintf(logfile,"verified %s,  time=%.1f,  errors: %llu\n\n",id,(clock()-startingTime)/CLOCKS_PER_SEC,i);
        if (i==0) {
            out=fopen(ver_name,"w");
            if (out==NULL) {
                printf("Write failure on %s\n",ver_name);
                return(i);
            }
            fprintf(out,"verified %s,  time=%.1f,  errors: %llu\n",id,(clock()-startingTime)/CLOCKS_PER_SEC,i);
            fprintf(out,"win: %s\n",neatNumber(win));
            fprintf(out,"draw: %s\n",neatNumber(draw));
            fprintf(out,"lose: %s\n",neatNumber(lose));
            fclose(out);
        } else {
            exit(1);
        }
    }
    return(i);
}

void saveSolve(FILE *out)
{
    int color,nmoves,bestmove,bestscore,score,m;
    int n,nr,ncol;
    static char local[93];
    int j;
    int wsm,bsm;
    char comment[255],com2[255];
    
    game_color=white;
    
    init_history();
    for(j=0;j<50;j++) local[map[j]]=board[map[j]];
    
    set_pieces();
    color=white;
    n=0;
    do {
        nmoves=move_list(0,color);
        if (nmoves==0) break;
        ncol=color^1;
        bestmove=-1;
        bestscore=-1;
        sprintf(comment,"");
        //display_board();
        for(m=0;m<nmoves;m++) {
            do_move(movelist[0][m]);
            wsm=findWS(pieces[white|man],pieces[white|crown],pieces[black|man],pieces[black|crown]);
            bsm=findBS(pieces[white|man],pieces[white|crown],pieces[black|man],pieces[black|crown]);
            score=-1;
            if (pieces[ncol|man]!=0 || pieces[ncol|crown]!=0) {
                nr=database_nr(color^1,pieces[white|man],pieces[white|crown],pieces[black|man],pieces[black|crown],wsm,bsm);
                if (mem64db[nr]<0) {
                    if (color==white) {
                        load_database(pieces[black|man],pieces[black|crown],pieces[white|man],pieces[white|crown],bsm,wsm);
                    } else {
                        load_database(pieces[white|man],pieces[white|crown],pieces[black|man],pieces[black|crown],wsm,bsm);
                    }
                }
                score=database_retreive_value(color^1,pieces[white|man],pieces[white|crown],pieces[black|man],pieces[black|crown],wsm,bsm);
            }
            undo_move(movelist[0][m]);
            if (score<MPLY) {
                if ((score & 1)==0) {  // win
                    score=2000-score;
                } else { // lose
                    score=100+score;
                }
            } else {
                score=255;
            }
            if (score>bestscore) {
                bestscore=score;
                bestmove=m;
                sprintf(comment,"");
            } else if (score==bestscore) {
                if (strcmp(comment,"")!=0) {
                    strcat(comment,", ");
                }
                sprint_move(com2,movelist[0][m]);
                strcat(comment,com2);
            }
        }

        if (bestscore==255) break;
        color^=1;
        //printf("%i %i\n",n,bestscore);
        xstore_history(movelist[0][bestmove],comment);
        do_move(movelist[0][bestmove]);
        //display_board(); printf("\n");
        n++;
    } while (nmoves>0);
    fprintf(out,"<center>\n");
    write_dw2(out);
    fprintf(out,"</center>\n");
    
    fprintf(out,"<hr>\n<br>\n<TT>\n");
    sprintf(pdn_info.result,"2-0");
    sprintf(pdn_info.whitepl,"Perfect play");
    sprintf(pdn_info.blackpl,"Perfect play");
    write_pdn2(out,1);
    fprintf(out,"</TT><hr>\n");
    for(j=0;j<50;j++) board[map[j]]=local[map[j]];
}

DBINDEX htmlStats(FILE *out,int wman,int wcrown,int bman,int bcrown)
/* returns number of LEGAL positions in database */
{
    DBINDEX nr,size,j,n;
    DBINDEX index,count;
    DBINDEX dtw[256];
    char path[256];
    char local[93];
    
    int list[12],type[12],constraint[12],min[12],max[12];
    char *id;
    int best,known,original,score,nmoves,m;
    DBINDEX total=0;
    count=0;
    int bestlose;
    int k=0;
    DBINDEX win=0,draw=0,lose=0,unknown=0;
    int v;
    int deepestWin=0;
    int deepestLose=0;
    int c,i,maxd;
    DBINDEX showIndex;
    FILE *outd;
	int ws,bs;
	    
    sprintf(path,"stats/details-%i%i%i%i.html",wman, wcrown, bman, bcrown);

    for (v=0;v<256;v++) dtw[v]=0;
	for (ws=0;ws<countSliceWhite(wman,wcrown,bman,bcrown);ws++) {
		for (bs=0;bs<countSliceBlack(wman,wcrown,bman,bcrown);bs++) {

		    id=database_name(wman,wcrown,bman,bcrown,ws,bs);
		    makeSureLoaded(wman,wcrown,bman,bcrown,ws,bs);
		            		
		    nr=database_nr(white,wman,wcrown,bman,bcrown,ws,bs);
		    if (mem64db[nr]<0)  {
		        printf("database is not present\n");
		        return;
		    }
		
		                    
		    n=init_nextboard(list,type,constraint,min,max,wman,wcrown,bman,bcrown,ws,bs);
		    i=0;
		    do {
		        index=database_linear_index(white);
		
		        v=read_value(mem64db[nr],index);
		        //printf("%llu\n",index);
		        if (v>MPLY) {
		            draw++;
		        } else {
		            if ((v & 1)==1) {
		                win++;
		                if (v>deepestWin) {
		                    deepestWin=v;
		                    for(j=0;j<50;j++) local[map[j]]=board[map[j]];
		                }
		            }
		            if ((v & 1)==0) {
		                lose++;
		                if (v>deepestLose) deepestLose=v;
		            }
		        }
		        dtw[v]++;
		        total++;
		        if ((total & 65535)==0) {
		            printf("counting: %s      \r",neatNumber(total));
		            fflush(stdout);
		        }
		    } while(nextboard(list,type,constraint,min,max,n-1)==false);
		}
	}

    for(j=0;j<50;j++) board[map[j]]=local[map[j]];
    display_board();
    printf("Deepest win: %i ply\n",deepestWin);
    sprintf(path,"stats/details-%i%i%i%i.html", wman, wcrown, bman, bcrown);
    outd=fopen(path,"w");
    if (outd==NULL) {
        dprint("dw_write: not possible to save '%s'\n",path);
        return;
    }
    fprintf(outd,"<HTML>\n");
    fprintf(outd,"<META NAME=\"ROBOTS\" CONTENT=\"NOINDEX\">\n");
    fprintf(outd,"<body bgcolor=\"#FDF6E6\" link=\"#FF9900\" vlink=\"#993300\" alink=\"#000080\">\n");
    fprintf(outd,"<center><b>Deepest win for white:</center></b><br>\n");
    saveSolve(outd);
    fprintf(outd,"\n<TABLE WIDTH=100%%><tr>\n");
    for (c=0;c<2;c++) {
        fprintf(outd,"<td width=50%% valign=top>\n");
        if (c==0) fprintf(outd,"<b>Number of positions with white to win in X moves</b><br>\n");
        if (c==1) fprintf(outd,"<b>Number of positions with white to lose in X moves</b><br>\n");
        maxd=0;
        for(i=c+1;i<MPLY;i+=2) {
            if (dtw[i]!=0) maxd=i;
        }
        for(i=c+1;i<=maxd;i+=2) {
            if (c==0) fprintf(outd,"<font color=#808080>%i:</font> %s<br>\n",(i+1)/2,neatNumber(dtw[i]));
            if (c==1) fprintf(outd,"<font color=#808080>%i:</font> %s<br>\n",i/2,neatNumber(dtw[i]));
        }
        fprintf(outd,"</td>\n");
    }
    fprintf(outd,"</tr></TABLE>\n");
    fprintf(outd,"</HTML>\n");
    fclose(outd);

    sprintf(path,"details-%i%i%i%i.html",wman, wcrown, bman, bcrown);
    
    fprintf(out,"<tr>");
    fprintf(out,"<td>%i%i%i%i: ",wman,wcrown,bman,bcrown);
    for (i=0;i<wman;i++) fprintf(out,"<img src=wm.png>");
    for (i=0;i<wcrown;i++) fprintf(out,"<img src=wk.png>");
    fprintf(out," v ");
    for (i=0;i<bman;i++) fprintf(out,"<img src=bm.png>");
    for (i=0;i<bcrown;i++) fprintf(out,"<img src=bk.png>");
    fprintf(out,"</td>");
    fprintf(out,"<td>%s   <font color=#808080>(%.1f%%)</font></td>",neatNumber(win),100*((double) win)/total);
    fprintf(out,"<td>%s</td>",neatNumber(draw));
    fprintf(out,"<td>%s</td>",neatNumber(lose));
    fprintf(out,"<td>%i</td>",(deepestWin+1)/2);
    fprintf(out,"<td>%i</td>",deepestLose/2);
    fprintf(out,"<td><a href=%s>details</a></td>",path);
    fprintf(out,"</tr>\n",deepestLose/2);
    return(total);
}

void allHtmlStats(int n1,int n2)
{
    int i,j;
    int ws,bs;
    int maxws,maxbs;
    DBINDEX total=0;
    char fname[100];
    FILE *out;
    int done[12][12][12][12];
    int k,l;
    
    sprintf(fname,"stats/endgamestats-%iv%i.html",n1,n2);
    
    for (i=0;i<12;i++) for (j=0;j<12;j++) for (k=0;k<12;k++) for (l=0;l<12;l++) done[i][j][k][l]=0;
    
    out=fopen(fname,"w");
    if (n1 != n2) {
        for (j=0;j<=n2;j++) {
             for (i=0;i<=n1;i++) {
                if (done[i][n1-i][j][n2-j]==0) {
                    total+=htmlStats(out,n1-i,i,n2-j,j); 
                    done[i][n1-i][j][n2-j]=1;
                    if (allocatedMemory>mem64_RAM()) free_all(-1,-1);
                }
            }
        }
    }

    for (i=0;i<=n1;i++) {
        for (j=0;j<=n2;j++) {
            if (done[n2-j][j][n1-i][i]==0) {
                total+=htmlStats(out,n2-j,j,n1-i,i); 
                done[n2-j][j][n1-i][i]=1;
                //if (i != j || n1-i != n2-j) {
                //    total+=htmlStats(out,j,n2-j,i,n1-i);
                //   done[j][n2-j][i][n1-i]=1;
                //}
                if (allocatedMemory>mem64_RAM()) free_all(-1,-1);
            }
        }
    }
    fclose(out);
    printf("Number of legal positions in selection: %s\n",neatNumber(total));
}

void setMode(int m)
{
	mode=m;
	if (mode==WDL) {
		printf("Database mode: Win/Draw/Lose, 2 bits/position. Type 'dtw' to switch mode.\n");
	}
	if (mode==DTW) {
		printf("Database mode: Distance to win, 8 bits/position. Type 'wdl' to switch mode.\n");
	}
	free_all(-1,-1);
}   


void loadDependend(int wman,int wcrown,int bman,int bcrown,int ws,int bs)
{
    int bm,wm,bc,wc;
    
    for(bm=0;bm<=bman;bm++)
        for (bc=0;bc<=bcrown;bc++)
            if ((bc > 0 || bm > 0) && !(bm == bman && bc == bcrown)) {
                if (availableOnDiskFull(bm,bc,wman,wcrown)) load_databaseFull(bm,bc,wman,wcrown);
                if (wman>0 && availableOnDiskFull(bm,bc,wman-1,wcrown+1)) load_databaseFull(bm,bc,wman-1,wcrown+1);  /* capture AND promote */
            }
    
    /* database 0: promote a white man */
    if (wman>0 && ws == (countSliceWhite(wman,wcrown,bman,bcrown)-1) && availableOnDiskFull(bman,bcrown,wman-1,wcrown+1)) load_databaseFull(bman,bcrown,wman-1,wcrown+1);
    
    /* database 1: capture 1 or more white pieces */
    for(wm=0;wm<=wman;wm++)
        for (wc=0;wc<=wcrown;wc++)
            if ((wc > 0 || wm > 0) && !(wm == wman && wc == wcrown)) {
                if (availableOnDiskFull(wm,wc,bman,bcrown)) load_databaseFull(wm,wc,bman,bcrown);
                if (bman>0 && availableOnDiskFull(wm,wc,bman-1,bcrown+1)) load_databaseFull(wm,wc,bman-1,bcrown+1);
            }
    /* promote a black man */
    if (bman>0 && bs == (countSliceWhite(wman,wcrown,bman,bcrown)-1) && availableOnDiskFull(wman,wcrown,bman-1,bcrown+1)) load_databaseFull(wman,wcrown,bman-1,bcrown+1);
    /* forward a white man */
    if (wman>0 && ws < (countSliceWhite(wman,wcrown,bman,bcrown)-1) && availableOnDisk(wman,wcrown,bman,bcrown,ws+1,bs)) load_database(wman,wcrown,bman,bcrown,ws+1,bs);
    /* forward a black man */
    if (bman>0 && bs < (countSliceBlack(wman,wcrown,bman,bcrown)-1) && availableOnDisk(wman,wcrown,bman,bcrown,ws,bs+1)) load_database(wman,wcrown,bman,bcrown,ws,bs+1);

}

DBINDEX verify_all(wman,wcrown,bman,bcrown,ws,bs,level,doverify)
// verifies a database
// specify ws=-1,bs=-1 to verify all slices in a database
// returns number of errors found
{
    int wm,wc,bm,bc,nr[2];
    DBINDEX errcount=0;
    FILE *in;
    char ver_name[100];        
    
    if (level<0) return;
    
    if (ws<0) ws=0; //countSliceWhite(wman,wcrown,bman,bcrown);
    if (bs<0) bs=0; //countSliceBlack(wman,wcrown,bman,bcrown);

    nr[0]=database_nr(white,wman,wcrown,bman,bcrown,ws,bs);
    nr[1]=database_nr(white,bman,bcrown,wman,wcrown,bs,ws);
    if (verified[nr[0]]==true) return(0);
    
    sprintf(ver_name,"%s",verify_name(wman,wcrown,bman,bcrown,ws,bs));
    in=fopen(ver_name,"r");
        if (in!=NULL) {
            fclose(in);
            //printf("%s already verified\n",database_name(wman,wcrown,bman,bcrown,ws,bs));
            return(0);
        }

    
    /* database 0: capture 1 or more black pieces */
    for(bm=0;bm<=bman;bm++)
        for (bc=0;bc<=bcrown;bc++)
            if ((bc > 0 || bm > 0) && !(bm == bman && bc == bcrown)) {
                errcount+=verify_all(bm,bc,wman,wcrown,-1,-1,level-1,doverify);
                if (wman>0) errcount+=verify_all(bm,bc,wman-1,wcrown+1,-1,-1,level-1,doverify);  /* capture AND promote */
            }
    
    /* database 0: promote a white man */
    if (wman>0 && ws == (countSliceWhite(wman,wcrown,bman,bcrown)-1)) errcount+=verify_all(bman,bcrown,wman-1,wcrown+1,-1,-1,level-1,doverify);
    
    /* database 1: capture 1 or more white pieces */
    for(wm=0;wm<=wman;wm++)
        for (wc=0;wc<=wcrown;wc++)
            if ((wc > 0 || wm > 0) && !(wm == wman && wc == wcrown)) {
                errcount+=verify_all(wm,wc,bman,bcrown,-1,-1,level-1,doverify);
                if (bman>0) errcount+=verify_all(wm,wc,bman-1,bcrown+1,-1,-1,level-1,doverify);
            }
    /* promote a black man */
    if (bman>0 && bs == (countSliceWhite(wman,wcrown,bman,bcrown)-1)) errcount+=verify_all(wman,wcrown,bman-1,bcrown+1,-1,-1,level-1,doverify);
    /* forward a white man */
    if (wman>0 && ws < (countSliceWhite(wman,wcrown,bman,bcrown)-1) ) errcount+=verify_all(wman,wcrown,bman,bcrown,ws+1,bs,level-1,doverify);
    /* forward a black man */
    if (bman>0 && bs < (countSliceBlack(wman,wcrown,bman,bcrown)-1) ) errcount+=verify_all(wman,wcrown,bman,bcrown,ws,bs+1,level-1,doverify);

    if (mem64db[nr[0]]<0)
        {
        if (availableOnDisk(wman,wcrown,bman,bcrown,ws,bs)) {
            load_database(wman,wcrown,bman,bcrown,ws,bs);
            if (nr[0]!=nr[1]) {
                load_database(bman,bcrown,wman,wcrown,bs,ws);
            }
        }
    }

    if (mem64db[nr[1]]<0)
        {
        if (availableOnDisk(bman,bcrown,wman,wcrown,bs,ws)) {
            load_database(bman,bcrown,wman,wcrown,bs,ws);
        }
    }



    /* load depended databases */
    loadDependend(wman,wcrown,bman,bcrown,ws,bs);
    loadDependend(bman,bcrown,wman,wcrown,bs,ws);

    
    if (doverify==true) errcount+=debug(DB_VERIFY,wman,wcrown,bman,bcrown,ws,bs);
    if (nr[0]!=nr[1] && doverify==true) errcount+=debug(DB_VERIFY,bman,bcrown,wman,wcrown,bs,ws);
    
    if (doverify==true )verified[nr[0]]=verified[nr[1]]=true;
    
    if (ws==0 && bs==0 && allocatedMemory>mem64_RAM()) {
        free_all(nr[0],nr[1]);
    }

    return(errcount);
}

int database_valueWDL(int color,int wman,int wcrown,int bman,int bcrown)
/* checks of board[] is in a loaded database. If it is, it returns
   one of:WIN,LOSE or UNKNOWN, seen from the white player. Inputs:
   color: player to move
   wman,wcrown,bman,bcrown: the number of these pieces on the board.
   In general these are known, so it speeds up the access.
   
   Call only for positions with 8 or less pieces
*/
{
    DBINDEX index;
    int score,nr;
    int ws,bs;
    unsigned char *db;
    
    if (use_db==false) return(UNKNOWN);
    ws=findWS(wman,wcrown,bman,bcrown);
    bs=findBS(wman,wcrown,bman,bcrown);
    nr=database_nr(color,wman,wcrown,bman,bcrown,ws,bs);
    
    
    if (mem64db[nr]<0) {
        // database not available in memory
        if (loadDatabaseOnDemand[nr]==true) {
            if (color==white && availableOnDisk(wman,wcrown,bman,bcrown,ws,bs)==true) {
                load_database(wman,wcrown,bman,bcrown,ws,bs);
            } else if (color==black && availableOnDisk(bman,bcrown,wman,wcrown,bs,ws)==true) {
                load_database(bman,bcrown,wman,wcrown,bs,ws);
            } else { // not available on disk, so don't try again
                loadDatabaseOnDemand[nr]=false;
                return(UNKNOWN);
            }
        } else {  // not preloaded, and do not load on demand
            return(UNKNOWN);
        }
    }
    
    index=database_linear_index(color);
    score=read_value(mem64db[nr],index);
    ndat++; 
 
    if (color==white) {
        db_usage[wman+8*wcrown+64*bman+512*bcrown]++;
    } else {
        db_usage[bman+8*bcrown+64*wman+512*wcrown]++;
    }
 
    
    if (color==white) {
        if (score==DB_DRAW) return(DRAW);
        if (score==DB_WIN) return(WIN);
        if (score==DB_LOSE) return(LOSE);
    }
    else {
        if (score==DB_DRAW) return(DRAW);
        if (score==DB_WIN) return(LOSE);
        if (score==DB_LOSE) return(WIN);
    }

    return(score);
}

extern DBINDEX mult(int,int);

int db_main(int argc,char* argv[])
{
    char input[1024];
    float startTime;
    DBINDEX test;
    int i;
    FILE *t;
    int ws,bs;
	char qname[100];

    
    //decompressDTWdatabase(1,1,1,0,0,0);
    logfile=fopen("log.txt","a");
    if (logfile==NULL) {
        printf("error 23\n");
        exit(1);
    }
    
    printf("Dragon database generator. (C) Michel Grimminck 2003-2004, GPL\n");
    printf("\n");
    printf("Type 'make 3 0 2 0' to create the 3 man versus 2 man databases.\n");
    printf("Type 'make 4 0 1 0' to create the 4 man versus 1 man databases.\n");
    printf("Type 'make 4 0 2 0' to create the 4 man versus 2 man databases. (128 MB req.)\n");
    printf("Type 'make 3 0 3 0' to create the 3 man versus 3 man databases. (128 MB req.)\n");
    printf("Type 'make 4 0 3 0' to create the 4 man versus 3 man databases. (1.5 GB req.)\n");
    printf("Type 'make 4 0 4 0' to create the 4 man versus 4 man databases. (16 GB req.)\n");
    printf("Recommended RAM is at least twice as much as stated above. Depth based \n");
    printf("databases require another 4 times as much RAM.\n");
    printf("\n");
    printf("You can stop and restart this program at any time, but you will lose the\n");
    printf("time spend on the last calculation. Use 'ctrl-S' to temporaly pause the\n");
    printf("program.\n");
    printf("\n");
    printf("Type 'help' for more help.\n\n");
    init_var();
    init_databases();
    setMode(WDL);
    
    mem64_init(true);

    i=1;
    while(i<argc) {
        if (strcmp(argv[i],"-wdl2")==0) {
            create_database(1,0,1,0,0,0,1000);
            exit(1);
        }
        if (strcmp(argv[i],"-wdl4")==0) {
            create_database(2,0,2,0,0,0,1000);
            create_database(3,0,1,0,0,0,1000);
            exit(1);
        }
        if (strcmp(argv[i],"-wdl5")==0) {
            create_database(3,0,2,0,0,0,1000);
            create_database(4,0,1,0,0,0,1000);
            exit(1);
        }
        if (strcmp(argv[i],"-wdl6")==0) {
            create_database(4,0,2,0,0,0,1000);
            create_database(3,0,3,0,0,0,1000);
            exit(1);
        }
        if (strcmp(argv[i],"-wdl7")==0) {
            create_database(4,0,3,0,0,0,1000);
            create_database(5,0,2,0,0,0,1000);
            exit(1);
        }
        if (strcmp(argv[i],"-dtw6")==0) {
            setMode(DTW);
            create_database(4,0,2,0,0,0,1000);
            exit(1);
        }
    }
    
#ifdef EXAMPLE_DTW_ACCESS
    init_board();
    for(i=0;i<50;i++) board[map[i]]=empty;
    int n;
    board[F6]=white|crown;
    board[F7]=white|crown;
    board[F22]=white|crown;
    board[F49]=black|crown;
    
    display_board(); printf("\n");
    set_pieces();
    
    printf("white: result database_valueDTW(): %i\n",database_valueDTW(white,pieces[white|man],pieces[white|crown],pieces[black|man],pieces[black|crown]));
    printf("black: result database_valueDTW(): %i\n",database_valueDTW(black,pieces[white|man],pieces[white|crown],pieces[black|man],pieces[black|crown]));
    printf("white: result theoreticDTW(): %i\n",theoreticDTW(white));
    printf("black: result theoreticDTW(): %i\n",theoreticDTW(black));
    exit(1);
#endif

    do {
        int wman,wcrown,bman,bcrown,ws,bs;

        if (mode==WDL) {
        	printf("generate wdl> ");
        } else {
        	printf("generate dtw> ");
        }
        scanf("%s",input);
        if (input[0]=='!') system(&input[1]);
        else if (strcmp(input,"help")==0) {
            printf("\
make {wm} {wc} {bm} {bc}                    create full database\n\
                                            wm=#white man, wc=#white kings\n\
                                            bm=#black man, bc=#black kings\n\
makesub {wm} {wc} {bm} {bc} {ws} {bs}       create slice of database\n\
                                            ws=white slice [0..8] bs=black\n\
verify {wm wc} {bm} {bc}                    Verify consistency of\n\
                                            given and sub-databases.\n\
wdl                                         Generate win/draw/lose databases\n\
dtw                                         Generate distance to win databases\n\
find {value} {wm wc} {bm} {bc} {ws} {bs}    find positions with\n\
                                            given value: 0=lose, 1=win in 1,\n\
                                            2=lose in 1,etc. 255=draw.\n\
count {wm wc} {bm} {bc}                     Number of positions in\n\
                                            a specific database\n\
quit                                        Quit program\n\
load {wm} {wc} {bm} {bc}                    Load database into memory\n\
freeall                                     Free all memory\n\
countval {wm} {wc} {bm} {bc} {ws} {bs}      Show number of wins/draw/loses\n\
                                            in database. Use ws=-1, bs=-1\n\
dumpq {queue 0/1} {number}                  Show the positions in the\n\
                                            queue\n\
size {wm} {wc} {bm} {bc}                    Show statistics about memory-\n\
                                            requirements\n\
html {wm} {wc} {bm} {bc}                    Save database statistics as html\n\
                                            File saved in 'stats' directory.\n\
htmlall {n1} {n2}                           Save database statistics as html\n\
\n\
        Database limitations:\n\
        - No database may be deeper than %i moves\n\
        - The largest database may contain only 8 pieces\n\
        - There may be at most 5 pieces of each type (white/black man/king)\n\
        \n\
        The database-generator is released under the Gnu public License\n\
        Source can be found at: http://www.xs4all.nl/~mdgsoft/draughts\n\
        \n",MPLY);
            printf("Index size:%i bit\n\n",8*sizeof(DBINDEX));
    
        }
        else if (strcmp(input,"size")==0) {
            int wm,bm,wc,bc;
            int ws1,bs1;
            char sBig[100];
            int pass;
           	DBINDEX a=0,sz;
           	DBINDEX big=0;

            scanf("%i%i%i%i",&wman,&wcrown,&bman,&bcrown);
            a=0;
				
		    for (pass=0;pass<2;pass++) {
		        if (pass==1) {
	                printf("To create %i%i%i%i, you need %s uncompressed bytes of storage.\n",wman,wcrown,bman,bcrown,neatNumber(a));
	                printf("The biggest segments are:\n");
	            }
			    for(wm=0;wm<=7;wm++) for(wc=0;wc<=7;wc++) {
		            for(bm=0;bm<=7;bm++) for(bc=0;bc<=7;bc++) {
	                    if ((wm+wc)>0 && (bm+bc)>0) {
	                        if ((wm<=wman && bm<=bman && wc<=(wman+wcrown) && bc<=(bman+bcrown)) || (bm<=wman && wm<=bman && bc<=(wman+wcrown) && wc<=(bman+bcrown))) {
	                            if ((wm+wc)<=(wman+wcrown) && (bm+bc)<=(bman+bcrown)) {
									for (ws=0;ws<countSliceWhite(wm,wc,bm,bc);ws++) for (bs=0;bs<countSliceBlack(wm,wc,bm,bc);bs++) {
										sz=db_count(wm,wc,bm,bc,ws,bs);
										if (sz>big) big=sz;
										if (pass==1 && sz>big/3) {
											printf("    %i%i%i%i.%i%i:  %s",wm,wc,bm,bc,ws,bs,neatNumber(sz));
											if (mode==WDL) {
												printf("  (%s bytes)",neatNumber(sz/4));
											}
											printf("\n");
										}
										a+=sz;
									}
								}
							}
						}
					}
				}
				if (pass==1) {
	                printf("These segments need to fit in RAM or the calculation will take extremely long.\n");
	            }
	        }
        }
        else if (strcmp(input,"make")==0 || strcmp(input,"makesub")==0) {
            int ws1=0,bs1=0;
            fprintf(logfile,"Starting\n");
            scanf("%i%i%i%i",&wman,&wcrown,&bman,&bcrown);
            if (strcmp(input,"makesub")==0) scanf("%i%i",&ws1,&bs1);    
            startTime=clock();
            fprintf(logfile,"Starting\n");
            startTime=clock();
		    
            //exit();
            create_database(wman,wcrown,bman,bcrown,ws1,bs1,1000);
            fprintf(logfile,"Total time: %.1f\n",(clock()-startTime)/CLOCKS_PER_SEC);
        }
        else if (strcmp(input,"find")==0) {
            int value,nr;
            usecol=false;
            scanf("%i%i%i%i%i%i%i",&value,&wman,&wcrown,&bman,&bcrown,&ws,&bs);
            makeSureLoaded(wman,wcrown,bman,bcrown,ws,bs);
            debug(value,wman,wcrown,bman,bcrown,ws,bs);
        }
        else if (strcmp(input,"html")==0) {
            int value,nr;
            scanf("%i%i%i%i",&wman,&wcrown,&bman,&bcrown);
            htmlStats(stdout,wman,wcrown,bman,bcrown);
        }
        else if (strcmp(input,"wdl")==0) {
            if (allocatedMemory>0) {
                printf("Not possible with databases loaded\n");
            } else {
    			setMode(WDL);
    		}
        }
        else if (strcmp(input,"dtw")==0) {
            if (allocatedMemory>0) {
                printf("Not possible with databases loaded\n");
            } else {
    			setMode(DTW);
    		}
        }
        else if (strcmp(input,"htmlall")==0) {
            int in1,in2;
            scanf("%i%i",&in1,&in2);
            allHtmlStats(in1,in2);
        }
        else if (strcmp(input,"count")==0) {
            double f,fz;
            DBINDEX cnt;
            DBINDEX total=0LL;
            scanf("%i%i%i%i",&wman,&wcrown,&bman,&bcrown);
            int iw,ib;
            
            for (iw=0;iw<countSliceWhite(wman,wcrown,bman,bcrown);iw++) {
                for (ib=0;ib<countSliceBlack(wman,wcrown,bman,bcrown);ib++) {
                    cnt=db_count(wman,wcrown,bman,bcrown,iw,ib);
                    total+=cnt;
                    printf("total: %i%i%i%i-%i%i %s\n",wman,wcrown,bman,bcrown,iw,ib,neatNumber(cnt));
                }
            }
            printf("total: %s\n",neatNumber(total));
        }
        else if (strcmp(input,"load")==0) {
            scanf("%i%i%i%i",&wman,&wcrown,&bman,&bcrown);
            load_databaseFull(wman,wcrown,bman,bcrown);
        }
        else if (strcmp(input,"countval")==0) {
            scanf("%i%i%i%i%i%i",&wman,&wcrown,&bman,&bcrown,&ws,&bs);
            makeSureLoaded(wman,wcrown,bman,bcrown,ws,bs);
            countvalue(wman,wcrown,bman,bcrown,ws,bs);
        } 
        else if (strcmp(input,"dumpq")==0) {
            int q;
            static char *local;
            int i,j,n;

            scanf("%i%i",&q,&n);
            qsize[q]=n;
            init_queue_read(q);
            for (i=0;i<n;i++) {
                printf("%i\n",i);
                local=read_from_queue(q);
                for(j=0;j<50;j++) board[map[j]]=local[map[j]];
                display_board();
            }
        }
        else if (strcmp(input,"fdumpq")==0) {
            int q;
            static char *local;
            int i,j,n;
            char name[100];
            
            scanf("%i%i",&q,&n);
            qsize[q]=n;
            init_queue_read(q);
            for (i=0;i<n;i++) {
                local=read_from_queue(q);
                for(j=0;j<50;j++) board[map[j]]=local[map[j]];
                sprintf(name,"queue-%i.dcp",i);
                printf("%s\n",name);
                save_board(white,name);
            }
        }
        else if (strcmp(input,"freeall")==0) {
            free_all(-1,-1);
        }
        else if (strcmp(input,"q")==0) {
			;
        }
        else if (strcmp(input,"quit")==0) {
			;
        }
        else if (strcmp(input,"verify")==0) {
            int value,nr;
            DBINDEX e=0;
            scanf("%i%i%i%i",&wman,&wcrown,&bman,&bcrown);
            startTime=clock();
            fprintf(logfile,"Starting\n");
            e=verify_all(wman,wcrown,bman,bcrown,-1,-1,1000,1);
            printf("Total number of errors: %s, execution time: %.1f\n",neatNumber(e),(clock()-startTime)/CLOCKS_PER_SEC);
            fprintf(logfile,"Total time: %.1f\n",(clock()-startTime)/CLOCKS_PER_SEC);
        } else {
        	printf("??? (Type 'help' for commands)\n");
        }

    } while(strcmp(input,"quit")!=0 && strcmp(input,"q")!=0 && strcmp(input,"exit")!=0);
    /*debug  (DB_LOSE,3,1,1,0);

    verify_all(3,0,3,0,10);
    verify_all(4,0,1,0,10);*/


    /* create_database(4,0,1,0,0);

     debug  (DB_LOSE,4,0,1,0);*/
    fclose(logfile);
    mem64_exit();
    removeQueues();

    return(0);
}

