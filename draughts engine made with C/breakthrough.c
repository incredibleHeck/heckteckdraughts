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

#include <stdio.h>
#include "var.h"
#include "functions.h"
#include <string.h>

int breakthroughBTM(int max)
{
    int nr,best,score,stdscore,nmoves,d;
       
    set_pieces();
    stdscore=pieces[white|man]-pieces[black|man];
    
    for(d=2;d<18;d+=2) {
        best=breakthrough(2,stdscore,d);
        
        
        nmoves=move_list(0,black);
        if (nmoves==0) return best;
        
        if (best!=127) {
            for(nr=0;nr<nmoves;nr++) {
                do_move(movelist[0][nr]);
                neval=0;
                score=breakthrough(2,stdscore,d);
                undo_move(movelist[0][nr]);
                if (score>best) best=score;
                if (score==127) break;
            }
        }
        if (best!=127) return best;
    }
    return best;
}
    
int breakthrough(int cdepth,int stdscore,int max)
/* returns:
    n=breakthrough in n moves
    126=material gain
    127=no breakthrough
*/    
{
    int nmoves,nmovesb,best,nr,nrb,score,bestblack;
   
    neval++; 
    tneval++;
    if (cdepth>max) return(127);
    if (neval>100000) return(127);
   
    set_pieces();
    if (cdepth==0) {
        stdscore=pieces[white|man]-pieces[black|man];
    } 
    nmoves=move_list(cdepth,white);
    if (nmoves==0) return 127;
    
    best=INF;
    if (quiet(white)==true && quiet(black)==true) {
        if (pieces[white|man]-pieces[black|man]>stdscore) best=126;
    }
    
    for(nr=0;nr<nmoves;nr++) {
        do_move(movelist[cdepth][nr]);
        
        if (pieces[white|crown]>0) {
            undo_move(movelist[cdepth][nr]);
            return (cdepth/2+1);
        }
        nmovesb=move_list(cdepth+1,black);
        
        if (quiet(black)==true) {
            bestblack=breakthrough(cdepth+2,stdscore,max);
        } else {
            bestblack=-INF;
        }
                
        if (bestblack<127) {
            for(nrb=0;nrb<nmovesb;nrb++) {
        
                do_move(movelist[cdepth+1][nrb]);
                score=breakthrough(cdepth+2,stdscore,max);
                undo_move(movelist[cdepth+1][nrb]);
                
                if (score==127) {
                    bestblack=127;
                    break;
                }
                if (score>bestblack) bestblack=score;
            }
        }
        
        undo_move(movelist[cdepth][nr]);

        if (bestblack<best) best=bestblack;
        if (best==1) return best;
    }
    return best;
}

void generate_breakthrough()
{
    int field;
    int i1,i2,i3,i6,i7,i8,i11,i12,i13,i16,i17,i18,i21,i22,i26;
    int index=0;
    int res;
    FILE *out;
    int max;
    
    tneval=0;
    for (i1=0;i1<2;i1++)
    for (i2=0;i2<2;i2++)
    for (i3=0;i3<2;i3++)
    for (i6=0;i6<3;i6++)
    for (i7=0;i7<3;i7++)
    for (i8=0;i8<3;i8++)
    for (i11=0;i11<3;i11++)
    for (i12=0;i12<3;i12++)
    for (i13=0;i13<2;i13++)
    for (i16=0;i16<3;i16++)
    for (i17=0;i17<3;i17++)
    for (i18=0;i18<2;i18++)
    for (i21=0;i21<3;i21++)
    for (i22=0;i22<2;i22++)
    for (i26=0;i26<2;i26++) {
        init_board();
        for(field=0;field<50;field++) board[map[field]]=empty;
        if (i1==1) board[F1]=black|man;
        if (i2==1) board[F2]=black|man;
        if (i3==1) board[F3]=black|man;

        if (i6==1) board[F6]=black|man;
        if (i6==2) board[F6]=white|man;
        if (i7==1) board[F7]=black|man;
        if (i7==2) board[F7]=white|man;
        if (i8==1) board[F8]=black|man;
        if (i8==2) board[F8]=white|man;

        if (i11==1) board[F11]=black|man;
        if (i11==2) board[F11]=white|man;
        if (i12==1) board[F12]=black|man;
        if (i12==2) board[F12]=white|man;
        if (i13==1) board[F13]=black|man;

        if (i16==1) board[F16]=black|man;
        if (i16==2) board[F16]=white|man;
        if (i17==1) board[F17]=black|man;
        if (i17==2) board[F17]=white|man;
        if (i18==1) board[F18]=black|man;
        
        if (i21==1) board[F21]=black|man;
        if (i21==2) board[F21]=white|man;
        if (i22==1) board[F22]=black|man;
        
        if (i26==1) board[F26]=white|man;
        set_pieces();
        
        if (quiet(white)==true) {
            for (max=2;max<18;max+=2) {
                neval=0;
                res=breakthrough(0,0,max);
                if (res!=127) break;
            }
            
            if (quiet(white)==true && quiet(black)==true) {
                //display_board();
                printf("%i %i %i %llu\n",index,res,neval,tneval);
            }
            breakThrough[index]=res;
        }  else {
            breakThrough[index]=127;
        }
        
        if (quiet(black)==true) {
            neval=0;
            res=breakthroughBTM(max);
            if (quiet(white)==true && quiet(black)==true) {
                //display_board();
                printf("%i %i %i %llu\n",index,res,neval,tneval);
            }
            breakThrough[index+128*6561]=res;
        } else {
            breakThrough[index+128*6561]=127;
        }    
        index++;
    }
    out=fopen("tables/bt.bin","wb");
    if (out!=NULL) {
        fwrite(breakThrough,sizeof(char),2*128*6561,out);
    } else printf("write error\n");
    fclose(out);

}

int btEval(color)
{
    int index;
    int mm,om;
    int tmp;
        
    if (pieces[white|crown]!=0 || pieces[black|crown]!=0) return 0;
    index=0;
    if (board[F26]==(white|man)) index+=1;
    
    if (board[F22]==(black|man)) index+=2*1;
    if (board[F21]==(black|man)) index+=4*1;
    if (board[F21]==(white|man)) index+=4*2;

    if (board[F18]==(black|man)) index+=12*1;
    if (board[F17]==(black|man)) index+=24*1;
    if (board[F17]==(white|man)) index+=24*2;
    if (board[F16]==(black|man)) index+=72*1;
    if (board[F16]==(white|man)) index+=72*2;

    if (board[F13]==(black|man)) index+=216*1;
    if (board[F12]==(black|man)) index+=432*1;
    if (board[F12]==(white|man)) index+=432*2;
    if (board[F11]==(black|man)) index+=1296*1;
    if (board[F11]==(white|man)) index+=1296*2;

    if (board[F8]==(black|man)) index+=3888*1;
    if (board[F8]==(white|man)) index+=3888*2;
    if (board[F7]==(black|man)) index+=11664*1;
    if (board[F7]==(white|man)) index+=11664*2;
    if (board[F6]==(black|man)) index+=34992*1;
    if (board[F6]==(white|man)) index+=34992*2;
    
    if (board[F3]==(black|man)) index+=104976*1;
    if (board[F2]==(black|man)) index+=209952*1;
    if (board[F1]==(black|man)) index+=419904*1;
    
    if (color==white) {
        mm=breakThrough[index];
    } else {
        om=breakThrough[index+128*6561];
    }
    //dprint("%i %i\n",index,btw);
    index=0;
    if (board[F25]==(black|man)) index+=1;
    
    if (board[F29]==(white|man)) index+=2*1;
    if (board[F30]==(white|man)) index+=4*1;
    if (board[F30]==(black|man)) index+=4*2;

    if (board[F33]==(white|man)) index+=12*1;
    if (board[F34]==(white|man)) index+=24*1;
    if (board[F34]==(black|man)) index+=24*2;
    if (board[F35]==(white|man)) index+=72*1;
    if (board[F35]==(black|man)) index+=72*2;

    if (board[F38]==(white|man)) index+=216*1;
    if (board[F39]==(white|man)) index+=432*1;
    if (board[F39]==(black|man)) index+=432*2;
    if (board[F40]==(white|man)) index+=1296*1;
    if (board[F40]==(black|man)) index+=1296*2;

    if (board[F43]==(white|man)) index+=3888*1;
    if (board[F43]==(black|man)) index+=3888*2;
    if (board[F44]==(white|man)) index+=11664*1;
    if (board[F44]==(black|man)) index+=11664*2;
    if (board[F45]==(white|man)) index+=34992*1;
    if (board[F45]==(black|man)) index+=34992*2;
    
    if (board[F48]==(white|man)) index+=104976*1;
    if (board[F49]==(white|man)) index+=209952*1;
    if (board[F50]==(white|man)) index+=419904*1;

    if (color==white) {
        om=breakThrough[index+128*6561];
    } else {
        mm=breakThrough[index];
    }
    if (mm<127 && om==127) {
        //if (mm<126) return 200;
        return 180;
        }
    if (mm==127 && om==127) return 0;
    if (mm<127 && om<127) return 20;
    if (mm==127 && om<127) {
     //   display_board(); printf("%i %i %i\n",color,mm,om);
        return -150;
    }
    
    /*
    if (btw==1) return 300;
    if (btw==2) return 270;
    if (btw==3) return 240;
    if (btw==4) return 210;
    if (btw==5) return 180;
    if (btw==6) return 150;
    if (btw==7) return 120;
    if (btw==8) return 110;

    if (btb==126) return -30;
    if (btb==1) return -200;
    if (btb==2) return -180;
    if (btb==3) return -160;
    if (btb==4) return -140;
    if (btb==5) return -120;
    if (btb==6) return -100;
    if (btb==7) return -800;
    if (btb==8) return -60;
    if (btw==127) return 0;
    if (btb==127) return 0;
    */
    //dprint("%i %i\n",index,btb);
    
    return 0;
}

void loadBreakThrough()
{
    FILE *in;
    
    in=my_fopen("tables/bt.bin","rb");
    if (in!=NULL) {
        fread(breakThrough,sizeof(char),2*128*6561,in);
        fclose(in);
    } else {
        dprint("MSGBOX|tb not found\n");
        exit(0);
    }
}
