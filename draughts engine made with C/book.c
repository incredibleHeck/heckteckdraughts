/*
 * Copyright 1996 by Michel D. Grimminck
 *
 * All Rights Reserved
 *
 * Permission to use, copy, modify, and distribute this software and its
 * documentation for any purpose and without fee is hereby granted,
 * provided that the above copyright notice appear in all copies and that
 * both that copyright notice and this permission notice appear in
 * supporting documentation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 */

/* creating a new book:
   1) Make single book file: cat *.pdn > book.tmp;mv book.tmp book.pdn
   2) Delete tables/0.bin 
   3) In the commandline type:
      make_bin_book book.pdn
   4) Make sure that number of entries smaller than maxbook
   5) In the commandline type: 'booklearn 800' for a 8-ply search of the leaf-nodes of the book (can take a while)
   6) In the commandline type: savetables
*/

#include <stdio.h>
#include <math.h>
#include <stdlib.h>
#include "var.h"
#include "functions.h"

#define MAXBOOKRETRY 20

struct _table_entry {
    unsigned int hashkey;
    unsigned char board[25];
    char color;
    int evaltype;
    int eval;
    int usage;
    int effort;
    int nWin;
    int nDraw;
    int nLose;
} *table[NTABLE],*book_entry;
int table_size[NTABLE];
int book_entry_nr=0;
int table_change[NTABLE];

int remap_tt()
/* find the correct tabletype for board */
{
    int totalman;

    totalman=pieces[white|man]+pieces[black|man]+pieces[white|crown]+pieces[black|crown];
    if (totalman<=5) return(-1);
    if (totalman==6) return(P6);
    if (totalman==8) return(P8);
    if (totalman==10) return(P10);
    return(MISC);
}

void new_table_entry(int t,int color,int evaltype,int eval,int effort,int verbose)
{
    unsigned int key,entry;


    if (t==MISC) t=remap_tt();
    if (t<0) return;
    if (table_change[t]==T_LOCKED) return;

    key=hash_key(color);
    entry=key%table_size[t];
    printf("e: %i %i\n",table_size[t],entry);
    if (table[t][entry].color!=127) {
        if (table[t][entry].hashkey==key) { /* double position */
            return;
        }
        else {
            if (verbose>=1) printf("table collision on table %i.%i key:%i\n",t,entry,key);
            return;
        }
    }
    /* is there enough effort to store this position? */
    /*if (evaltype==AB && effort<800) return;
    if (evaltype==PN && effort<200) return;
    if (evaltype==PNTWO && effort<20) return;*/
    /* we have a clean entry */
    
    table[t][entry].hashkey=key;
    table[t][entry].eval=eval;
    table[t][entry].color=color;
    table[t][entry].effort=effort;
    table[t][entry].evaltype=evaltype;
    compress_board(table[t][entry].board,board);
    if (verbose>=10) {
        printf("\n\nnew table entry\n\n");
        /*display_board();*/
    }
    if (table_change[t]==T_UNCHANGED) table_change[t]=T_CHANGED;
}

void make_bin_book(char *pdn)
{
    BTYPE tempboard[93];
    int score;

    parameters[0]=-3;search_min=0;
    search_max=40;
    perc=1;
    copy_board(tempboard,board);
    /*  strcpy(pdnfile,"pdnbook/candidate95.pdn");
      score=check_database(pdnfile,search_min,search_max);
      strcpy(pdnfile,"pdnbook/wk83.pdn");
      score=check_database(pdnfile,search_min,search_max);
      strcpy(pdnfile,"pdnbook/prof2.pdn");
      score=check_database(pdnfile,search_min,search_max);
      strcpy(pdnfile,"pdnbook/dutch96h.pdn");
      score=check_database(pdnfile,search_min,search_max);
      strcpy(pdnfile,"pdnbook/book.pdn");
      score=check_database(pdnfile,search_min,search_max);
      strcpy(pdnfile,"pdnbook/damop.pdn");
      score=check_database(pdnfile,search_min,search_max);
      strcpy(pdnfile,"pdnbook/syb-andr.pdn");*/
    strcpy(pdnfile,pdn);
    score=check_database(pdnfile,search_min,search_max);
    copy_board(board,tempboard);
    table_change[BOOK]=T_CHANGED;
}

void tryGlobalHash(int color)
{
    unsigned int key,entry;
    int t;
    
    t=remap_tt();
    if (t<0) return;
    if (table_change[t]==T_LOCKED) return;
    key=hash_key(color);
    entry=key%table_size[t];
    //printf("aa %i %i %i\n",key,entry,t);
    
    if (table[t][entry].color!=127) {
        if (table[t][entry].hashkey==key) {
            varCount[t]++;
            return;
        }
    varCount[t+5]++;
    }
}

void init_tables(void)
{
    int t,i,score;
    FILE *in;
    char name[20];
    char tempboard[93];

    table_size[BOOK]=MAXBOOK;
    table_size[P6]=MAXBOOK;
    table_size[P8]=MAXBOOK;
    table_size[P10]=MAXBOOK;
    table_size[MISC]=MAXBOOK;

    for(t=0;t<NTABLE;t++) {
        table[t]=(struct _table_entry *)malloc((table_size[t])*sizeof(struct _table_entry));
        if (table[t]==NULL) {
            printf("malloc failed for table %i\n",t);
            table_size[t]=0;
            table_change[t]=T_LOCKED;
            exit(1);
        }
        for(i=0;i<table_size[t];i++) {
            table[t][i].color=127;
            table[t][i].hashkey=-1;
        }
        table_change[t]=T_UNLOADED;

        /* load files */
        sprintf(name,"tables/%i.bin",t);
        in=my_fopen(name,"rb");
        if (in!=NULL) {
            fread(table[t],sizeof(struct _table_entry),table_size[t],in);
            fclose(in);
            table_change[t]=T_UNCHANGED;
        }
    }
    /* specifics for BOOK table */
    book_entry=table[BOOK];
}

void save_tables(void)
{
    char name[20];
    int t;
    FILE *out;

    for(t=0;t<NTABLE;t++) {
        if (table_change[t]==T_UNCHANGED) continue;
        if (table_change[t]!=T_CHANGED) {
            printf("error: table %i has status %i\n",t,table_change[t]);
            printf("enter 'yes' to force writing\n");
            /*sscanf(name,"%s";
            if (strcmp(name,"yes")!=0) continue;*/
        }
        sprintf(name,"tables/%i.bin",t);
        out=fopen(name,"wb");
        if (out!=NULL) {
            printf("writing table %i\n",t);
            fwrite(table[t],sizeof(struct _table_entry),table_size[t],out);
            table_change[t]=T_UNCHANGED;
        } else printf("write error\n");
        fclose(out);
    }

}

void try_learn(int color)
{
    int tm,n,m;


    tm=pieces[white|man]+pieces[black|man]+pieces[white|crown]+pieces[black|crown];
    m=material(color);
    if (m!=0) return;

    if (tm==6) n=3500;
    else if (tm==8) n=1000;
    else return;

    display_board();
    do_pn_search(color,n,WINTHEO,2);
}

void tablestats(void)
{
    int t,i,j,etype[10];
    char name[30];
    int count=0;
    for(t=0;t<NTABLE;t++) {
        if (t==BOOK) strcpy(name,"BOOK");
        else if (t==P6) strcpy(name,"6PIECES");
        else if (t==P8) strcpy(name,"8PIECES");
        else if (t==P10) strcpy(name,"10PIECES");
        else if (t==MISC) strcpy(name,"MISC");
        else strcpy(name,"UNKNOWN");
        printf("statistics table '%s'\n",name);
        if (table_change[t]==T_UNLOADED) strcpy(name,"unloaded");
        else if (table_change[t]==T_LOCKED) strcpy(name,"locked");
        else if (table_change[t]==T_UNCHANGED) strcpy(name,"unchanged");
        else if (table_change[t]==T_CHANGED) strcpy(name,"changed");
        else strcpy(name,"UNKNOWN");
        printf("   status: %s\n",name);
        printf("   size:%i entries\n",table_size[t]);
        count=0;
        for(i=0;i<10;i++) etype[i]=0;
        for(i=0;i<table_size[t];i++) {
            if (table[t][i].color!=127) {
                count++;
                etype[table[t][i].evaltype]++;
            }
        }
        printf("   used total:%i (%.1f%%)\n",count,100.0F*(float)count/table_size[t]);
        printf("   evaltype: book:%i  ab:%i  pn:%i  pn2:%i\n",etype[EBOOK],etype[AB],etype[PN],etype[PNTWO],etype[EBOOK]);
    }
}

void add_book_entry(int color,int gameresult,int eval,int docount)
{
    unsigned int key,entry;
    int i,e;
    key=hash_key(color);
    entry=key%MAXBOOK;


    e=0;
    while(e<MAXBOOKRETRY) {
        if (book_entry[entry].color==127) goto store_book;
        if (book_entry[entry].color!=127) {
            if (book_entry[entry].hashkey==key) { /* double position */
                if (gameresult==1) book_entry[entry].nWin++;
                if (gameresult==0) book_entry[entry].nDraw++;
                if (gameresult==-1) book_entry[entry].nLose++;
                book_entry[entry].eval=eval;
                if (docount==true) book_entry[entry].usage++;
                return;
            }
        }
        entry=(entry+1)%table_size[BOOK]; e++;
    }
    return;
store_book:
    book_entry[entry].hashkey=key;
    book_entry[entry].eval=eval;
    book_entry[entry].color=color;
    book_entry[entry].evaltype=EBOOK;
    book_entry[entry].nWin=0;
    book_entry[entry].nDraw=0;
    book_entry[entry].nLose=0;
    if (gameresult==1) book_entry[entry].nWin++;
    if (gameresult==0) book_entry[entry].nDraw++;
    if (gameresult==-1) book_entry[entry].nLose++;
    compress_board(book_entry[entry].board,board);
    book_entry_nr++;
}

void book_info(void)
{
    printf("%i book entries\n",book_entry_nr);
}

int book_score(int color,unsigned int *bix)
/* index returned in *entry */
{
    int i,e;
    unsigned int key;
    unsigned char temp[25];
    unsigned int entry;
    
    key=hash_key(color);
    entry=key%MAXBOOK;
    e=0;
    while(e<MAXBOOKRETRY) {
        if (key==book_entry[entry].hashkey) goto retreive_book;
        entry=(entry+1)%table_size[BOOK];
        e++;
    }
    return(UNKNOWN);
retreive_book:
    compress_board(temp,board);
    for(i=0;i<25;i++) if (book_entry[entry].board[i]!=temp[i]) return(UNKNOWN);
    if (book_entry[entry].color!=color) return(UNKNOWN);
    //dprint("book: %i %i %i\n",book_entry[entry].nWin,book_entry[entry].nDraw,book_entry[entry].nLose);
    /*if (book_entry[entry].nWin>0 && book_entry[entry].nDraw==0 && book_entry[entry].nLose==0) return 1;
    if (book_entry[entry].nWin==0 && book_entry[entry].nDraw==0 && book_entry[entry].nLose>0) return -1;
    return 0;*/
    *bix=entry;
    return(book_entry[entry].eval);
}


int try_book(int depth,int color)
/* returns score if succesfull move is done, UNKNOWN otherwise
  book selection based on number of variants with the move combined with the backed-up scores of the variant */
{
    int nmoves,x,best=-INF,i,score,bestmove=-1;
    double iterscore[MAXNM];
    int id;
    double sum=0.0;
    double s;
    int usage;
    int maxScore;
    int totalUsage;
    double w0;    
    double likelyness;   /* proportional to the move beiing selected */
    int entry;
    
    if (bookMode==0) return UNKNOWN;
    
    x=book_score(color,&entry);
    if (x==UNKNOWN) return(x);
    
    nmoves=move_list(depth,color);
    totalUsage=0;
    maxScore=-INF;
    for(i=0;i<nmoves;i++) {
        do_move(movelist[depth][i]);
        score=-book_score(color^1,&entry);
        usage=book_entry[entry].usage;
        if (score!=(-UNKNOWN) && score>-80) {
            totalUsage+=usage;
            if (score>maxScore) maxScore=score;
        }
        undo_move(movelist[depth][i]);
    }
    if (totalUsage==0) totalUsage=1;
    
    for(i=0;i<nmoves;i++) {
        do_move(movelist[depth][i]);
        score=-book_score(color^1,&entry);
        usage=book_entry[entry].usage;
        movecopy(movescore[i].move,movelist[depth][i]);
        movescore[i].value=score;
        iterscore[i]=0;
        if (score!=(-UNKNOWN) && score>-80) {
            double g;
            if (bookMode==1) { // standard book
                g=exp((score-maxScore)/300.0);
                likelyness=((double)usage/totalUsage+0.1)*g;  // with normal book, give less-used variants more chance of beiing played
            } else { // tournament book
                g=exp((score-maxScore)/80.0);
                likelyness=(double)usage/totalUsage*g;
            }
            iterscore[i]=likelyness;
            sum+=likelyness;
            print_move(movelist[depth][i]);
            dprint(" sc: %i %i %i %g %g\n",score,usage,100*usage/totalUsage,likelyness,g);
        }        
        undo_move(movelist[depth][i]);
    }
    if (sum==0) {
        printf("leaving book\n");
        return(UNKNOWN);
    }
    s=(double)rand()*sum/RAND_MAX;
    best=-1;
    w0=0;
    for (i=0;i<nmoves;i++) {
        w0+=iterscore[i];
        if (iterscore[i]!=0) {
            if (s<w0) {
                best=i;
                break;
            }
        }
    }
    if (best==-1) {printf("never get here 3\n");return(UNKNOWN);}

    xstore_history(movelist[depth][best],"book");
    win_print_move(movelist[depth][best]);
    winShowHistory();
    storemove(0,movelist[depth][best]);
    do_move(movelist[depth][best]);
    return(best);
}

int bookLearn0(int depth)
{
    int i;
    for (i=0;i<table_size[BOOK];i++) {
        if (book_entry[i].eval!=UNKNOWN) book_entry[i].eval=0;
    }
    bookLearn(0,depth,white);
}

int bookLearn(int cdepth,int depth,int color)
/* evaluate each node in the opening book
   returns score
 */
{
    int nmoves,i;
    int best;
    int dum=0;
    int flags=0;
    int score;
    int dummy;
        
    if (book_score(color,&dummy)!=UNKNOWN && book_score(color,&dummy)!=0) return book_score(color,&dummy);
    best=-INF;
    nmoves=move_list(cdepth,color);
    for(i=0;i<nmoves;i++) {
        do_move(movelist[cdepth][i]);
        score=-book_score(color^1,&dummy);
        if (score!=(-UNKNOWN)) {
            score=-bookLearn(cdepth+1,depth,color^1);
            //if (depth==0) printf("d0sc: %i\n",score);
            if (score!=(-UNKNOWN) && score>best) best=score;
        }
        undo_move(movelist[cdepth][i]);
    }
    if (best==-INF) {  /* leaf node */
        //printf("dd:%i\n",cdepth);
        init_stats();
        init_hash();
        
        best=alfabeta(-INF,INF,color,cdepth,depth-200,flags,&dum);
        best=alfabeta(-INF,INF,color,cdepth,depth,flags,&dum);
        printf(".");
        fflush(stdout);
        //display_board();
        //printf("cc1 %i %i\n",color,best);
    }
    //printf("best: %i\n",best);
    add_book_entry(color,-2,best,false);   
    if (cdepth==0) table_change[BOOK]=T_CHANGED;
    return best;
}
